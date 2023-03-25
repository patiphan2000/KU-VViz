# KU-VViz

> *KU-VViz* is a part of senior project for Kasetsart University Software and Knowledge Engineering.

[![NPM](https://img.shields.io/npm/v/ku-vviz.svg)](https://www.npmjs.com/package/ku-vviz) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**Kasetsart University&#x27;s Courses Verification &amp; Visualization** or **KU-VViz** for short is a react component library that can verify and visualize courses for KU students.

## Install

```bash
npm install --save ku-vviz
```

## Usage

```jsx
// Import the library & styles
import MyComponent from 'ku-vviz'
import 'ku-vviz/dist/index.css'

// return it from your components
return <KuVViz 
  course = {course}, 
  stdGrade = {stdGrade}, 
  stdEnroll = {stdEnroll}
/>

```

## Data Format
KU-VViz require 3 sets of data to be able to visualize the course properly.

#### Course Data
An array of object contain information for each subject in the course.
```json
[
    {
      "subject_code": "0001",
      "subject_name_th": "วิชา I",
      "subject_name_en": "Subject I",
      "credit": 3,
      "pre_subject": [],
      "grouping_data": "1/1"
    },
    {
      "subject_code": "0002",
      "subject_name_th": "วิชา II",
      "subject_name_en": "Subject II",
      "credit": 3,
      "pre_subject": ["0001"],
      "grouping_data": "1/2"
    },
    ... // more subject
]
```

#### Student Academic Record Data
An array of object contain student's academic records(subjects, cerdit, grade, registration, etc.) for *each academic year*.
```json
[
    {
      "academicYear": "2565/1",
      "grade": [
        {
          "std_code": "601234567",
          "subject_code": "0005",
          "subject_name_th": "วิชา V",
          "subject_name_en": "Subject V",
          "credit": 9,
          "grade": "A",
          "registration_year": 65,
          "registration_semester": 1,
          "grouping_data": "2565/1"
        }
      ]
    },
    {
      "academicYear": "2564/2",
      "grade": [
        {
          "std_code": "601234567",
          "subject_code": "0004",
          "subject_name_th": "วิชา IV",
          "subject_name_en": "Subject IV",
          "credit": 3,
          "grade": "A",
          "registration_year": 64,
          "registration_semester": 2,
          "grouping_data": "2564/2"
        },
        ... // more subject
      ]
    }
    ... // more academic year
]
```

#### Student Enroll Data
An array of object contain subjects that student enroll for the *current semester*.
```json
[
  {
    "subject_code": "0006",
    "subject_name_th": "วิชา VI",
    "subject_name_en": "Subject VI"
  },
  ... // more subject
]
```

## License

MIT © [patiphan2000](https://github.com/patiphan2000)
