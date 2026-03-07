# A/L Stream Requirements
AL_STREAM_REQUIREMENTS = {
    'Combined Maths': {
        'required_subjects': ['Mathematics', 'Science'],
        'helpful_subjects': ['English', 'ICT'],
        'min_avg_score': 65,
        'description': 'Engineering, Physical Science, Computer Science pathway',
        'career_paths': ['Engineering', 'Computer Science', 'Architecture', 'Quantity Surveying']
    },
    'Bio Science': {
        'required_subjects': ['Science', 'Mathematics'],
        'helpful_subjects': ['English', 'Sinhala'],
        'min_avg_score': 70,
        'description': 'Medicine, Veterinary, Biological Sciences pathway',
        'career_paths': ['Medicine', 'Veterinary', 'Pharmacy', 'Nursing', 'Medical Lab Science']
    },
    'Technology': {
        'required_subjects': ['Mathematics', 'Science', 'ICT'],
        'helpful_subjects': ['English'],
        'min_avg_score': 60,
        'description': 'Engineering Technology, Applied Sciences pathway',
        'career_paths': ['Engineering Technology', 'Information Technology', 'Quantity Surveying']
    },
    'Commerce': {
        'required_subjects': ['Mathematics', 'English'],
        'helpful_subjects': ['Geography', 'History'],
        'min_avg_score': 55,
        'description': 'Business, Accounting, Management pathway',
        'career_paths': ['Business Management', 'Accounting', 'Marketing', 'Finance', 'HRM']
    },
    'Arts': {
        'required_subjects': ['Sinhala', 'English'],
        'helpful_subjects': ['History', 'Geography', 'Buddhism'],
        'min_avg_score': 50,
        'description': 'Languages, Social Sciences, Humanities pathway',
        'career_paths': ['Law', 'Social Work', 'Teaching', 'Mass Communication', 'Languages']
    }
}

# Online Resource Database
ONLINE_RESOURCES = {
    'Mathematics': [
        {
            'title': 'O/L Mathematics Complete Course - Sinhala Medium',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_Mathematics_OL',
            'level': 'Beginner',
            'type': 'Video Series',
            'duration': '45 hours',
            'rating': 4.8,
            'language': 'Sinhala',
            'topics': 'Algebra, Geometry, Statistics'
        },
        {
            'title': 'Khan Academy - Mathematics Grade 8-11',
            'platform': 'Khan Academy',
            'url': 'https://www.khanacademy.org/math',
            'level': 'All Levels',
            'type': 'Interactive',
            'duration': 'Self-paced',
            'rating': 4.9,
            'language': 'English/Sinhala',
            'topics': 'Complete curriculum'
        },
        {
            'title': 'O/L Maths Past Papers Solutions',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/c/SriLankaMathsOL',
            'level': 'Intermediate',
            'type': 'Problem Solving',
            'duration': '30 hours',
            'rating': 4.7,
            'language': 'Sinhala',
            'topics': 'Past paper discussions'
        }
    ],
    'Science': [
        {
            'title': 'O/L Science Complete Guide - Biology, Chemistry, Physics',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_Science_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '50 hours',
            'rating': 4.8,
            'language': 'Sinhala',
            'topics': 'All three branches'
        },
        {
            'title': 'Interactive Science Simulations',
            'platform': 'PhET',
            'url': 'https://phet.colorado.edu/',
            'level': 'All Levels',
            'type': 'Interactive',
            'duration': 'Self-paced',
            'rating': 4.9,
            'language': 'English',
            'topics': 'Virtual experiments'
        },
        {
            'title': 'Science Practical Sessions - O/L',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/c/SciencePracticalLK',
            'level': 'Intermediate',
            'type': 'Practical Demo',
            'duration': '20 hours',
            'rating': 4.6,
            'language': 'Sinhala/English',
            'topics': 'Lab experiments'
        }
    ],
    'English': [
        {
            'title': 'English Grammar for O/L Students',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_English_OL',
            'level': 'Beginner',
            'type': 'Video Lessons',
            'duration': '25 hours',
            'rating': 4.7,
            'language': 'Sinhala explanations',
            'topics': 'Grammar, Writing, Reading'
        },
        {
            'title': 'BBC Learning English',
            'platform': 'BBC',
            'url': 'https://www.bbc.co.uk/learningenglish/',
            'level': 'All Levels',
            'type': 'Interactive',
            'duration': 'Self-paced',
            'rating': 4.9,
            'language': 'English',
            'topics': 'Comprehensive English'
        }
    ],
    'Sinhala': [
        {
            'title': 'O/L Sinhala Language & Literature',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_Sinhala_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '35 hours',
            'rating': 4.8,
            'language': 'Sinhala',
            'topics': 'Grammar, Literature, Writing'
        }
    ],
    'History': [
        {
            'title': 'Sri Lanka History for O/L',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_History_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '30 hours',
            'rating': 4.7,
            'language': 'Sinhala',
            'topics': 'Ancient to modern history'
        }
    ],
    'Geography': [
        {
            'title': 'O/L Geography - Sri Lanka & World',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_Geography_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '28 hours',
            'rating': 4.7,
            'language': 'Sinhala',
            'topics': 'Physical & human geography'
        }
    ],
    'Buddhism': [
        {
            'title': 'Buddhism for O/L Examination',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_Buddhism_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '25 hours',
            'rating': 4.8,
            'language': 'Sinhala',
            'topics': 'Buddhist philosophy & history'
        }
    ],
    'ICT': [
        {
            'title': 'O/L ICT Complete Course',
            'platform': 'YouTube',
            'url': 'https://www.youtube.com/playlist?list=PLxxx_ICT_OL',
            'level': 'All Levels',
            'type': 'Video Series',
            'duration': '35 hours',
            'rating': 4.8,
            'language': 'Sinhala/English',
            'topics': 'Theory & practical'
        },
        {
            'title': 'Code.org - Programming Basics',
            'platform': 'Code.org',
            'url': 'https://code.org/',
            'level': 'Beginner',
            'type': 'Interactive',
            'duration': 'Self-paced',
            'rating': 4.9,
            'language': 'English',
            'topics': 'Programming fundamentals'
        }
    ]
}
