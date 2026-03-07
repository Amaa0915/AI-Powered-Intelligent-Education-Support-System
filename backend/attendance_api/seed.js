require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Anomaly = require('./models/Anomaly');

// ── New dataset path ──────────────────────────────────────────────────────────
const ATTENDANCE_CSV = path.join(__dirname, './data/attendance.csv');

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

function getRiskLevel(rate) {
    if (rate < 60) return 'critical';
    if (rate < 75) return 'high';
    if (rate < 85) return 'medium';
    return 'low';
}

function parseMonth(monthStr) {
    const months = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    return months[(monthStr || '').toLowerCase()] || null;
}

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing data...');
    await Promise.all([Student.deleteMany({}), Attendance.deleteMany({}), Anomaly.deleteMany({})]);
    console.log('✅ Data cleared');

    console.log(`📖 Reading attendance CSV: ${ATTENDANCE_CSV}`);
    if (!fs.existsSync(ATTENDANCE_CSV)) {
        console.error('❌ CSV file not found:', ATTENDANCE_CSV);
        process.exit(1);
    }

    const rows = await parseCSV(ATTENDANCE_CSV);
    console.log(`📊 Processing ${rows.length} attendance records...`);

    const studentMap = {};   // student_id -> aggregated stats
    const attendanceDocs = [];

    for (const row of rows) {
        // ── Column mapping for new CSV ─────────────────────────────────────
        const sid = (row['StudentID'] || '').trim();
        const dateStr = (row['Date'] || '').trim();
        const grade = (row['Grade'] || '').trim();               // "Grade 8" / "Grade 9" / "Grade 10"
        const isPresent = row['Attendance'] === '1' || row['Attendance'] === 1;
        const event = (row['Event'] || 'normal').trim();          // term_start, exam, normal, …
        const weather = (row['Weather'] || '').trim();              // sunny, cloudy, rainy, windy
        const temp = parseFloat(row['Temperature']) || null;
        const dow = (row['DayOfWeek'] || '').trim();            // Monday … Friday
        const monthStr = (row['Month'] || '').trim();
        const month = parseMonth(monthStr);
        const isBeforeHoliday = (row['IsBeforeHoliday'] || 'False').trim().toLowerCase() === 'true';
        const isAfterHoliday = (row['IsAfterHoliday'] || 'False').trim().toLowerCase() === 'true';
        const distanceKm = parseFloat(row['DistanceKm']) || null;
        const distanceBand = (row['DistanceBand'] || '').trim() || null;

        if (!sid || !dateStr) continue;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) continue;

        const year = date.getFullYear();
        const status = isPresent ? 'Present' : 'Absent';

        // Accumulate student stats
        if (!studentMap[sid]) {
            studentMap[sid] = {
                student_id: sid,
                name: sid,
                grade,
                section: '',
                total_days: 0,
                present_days: 0,
                absent_days: 0,
                distance_km: distanceKm,
                distance_band: distanceBand,
            };
        }
        studentMap[sid].total_days++;
        if (isPresent) studentMap[sid].present_days++;
        else studentMap[sid].absent_days++;

        attendanceDocs.push({
            student_id: sid,
            date,
            year,
            month,
            status,
            day_of_week: dow,
            weather_condition: weather,
            temperature: temp,
            school_event: event,
            is_before_holiday: isBeforeHoliday,
            is_after_holiday: isAfterHoliday,
            is_holiday: false,
            distance_km: distanceKm,
            distance_band: distanceBand,
        });
    }

    // ── Insert Attendance ─────────────────────────────────────────────────
    console.log(`💾 Inserting ${attendanceDocs.length} attendance records...`);
    const CHUNK = 5000;
    for (let i = 0; i < attendanceDocs.length; i += CHUNK) {
        await Attendance.insertMany(attendanceDocs.slice(i, i + CHUNK), { ordered: false }).catch(() => { });
        process.stdout.write(`\r   ${Math.min(i + CHUNK, attendanceDocs.length)}/${attendanceDocs.length}`);
    }
    console.log('\n✅ Attendance records inserted');

    // ── Build and insert Students ─────────────────────────────────────────
    const studentDocs = Object.values(studentMap).map(s => {
        const rate = s.total_days ? parseFloat(((s.present_days / s.total_days) * 100).toFixed(2)) : 0;
        return {
            ...s,
            attendance_rate: rate,
            risk_level: getRiskLevel(rate),
            is_anomalous: false,
        };
    });

    console.log(`💾 Inserting ${studentDocs.length} student records...`);
    await Student.insertMany(studentDocs, { ordered: false }).catch(() => { });
    console.log('✅ Student records inserted');

    // ── Auto-generate anomalies for students below 75% ─────────────────────
    const anomalousDocs = studentDocs
        .filter(s => s.attendance_rate < 75)
        .map(s => ({
            student_id: s.student_id,
            name: s.name,
            grade: s.grade,
            anomaly_type: s.attendance_rate < 60 ? 'Chronic Absenteeism' : 'High Absence Rate',
            anomaly_score: parseFloat(((75 - s.attendance_rate) / 75).toFixed(3)),
            attendance_rate: s.attendance_rate,
            consecutive_absences: s.absent_days,
            risk_level: s.risk_level,
            description: `Student has ${s.attendance_rate}% attendance rate over ${s.total_days} school days.`,
            year: 2025,
        }));

    if (anomalousDocs.length > 0) {
        await Anomaly.insertMany(anomalousDocs, { ordered: false }).catch(() => { });
        await Student.updateMany(
            { student_id: { $in: anomalousDocs.map(a => a.student_id) } },
            { $set: { is_anomalous: true } }
        );
        console.log(`✅ ${anomalousDocs.length} anomaly records auto-generated`);
    }

    console.log('\n🎉 Database seeded successfully with new dataset!');
    console.log(`   📊 ${studentDocs.length} students | ${attendanceDocs.length} records`);
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
});
