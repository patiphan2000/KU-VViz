import { default as getCourseTree } from '../components/KUCourseVisualizer/courseTreeGen'
import { default as getStdTree } from '../components/KUCourseVisualizer/stdTreeGen'

export function SubjectVerification(
    subject_code, courseTree, stdTree,
    threshold = ['F', 'W', 'NP', 'X']
    ) {
    var isValid = true;
    if (threshold.includes(stdTree[subject_code].grade)) { return false; }

    const currSub = courseTree[subject_code];

    // check with pre_subject
    for (let i in currSub.pre_subject) {
        isValid = isValid && (!threshold.includes(stdTree[currSub.pre_subject[i]].grade));
    }

    // check with co_subject
    for (let i in currSub.co_subject) {
        isValid = isValid || (!threshold.includes(stdTree[currSub.pre_subject[i]].grade));
    }

    return isValid;
}

export function KUCourseVerification(courses, stdGrade, stdEnroll) {
    const courseTree = getCourseTree(courses);
    const stdTree = getStdTree(courseTree, stdGrade, stdEnroll);

    // console.log(stdTree);
    for (let sub in stdTree) {
        if (stdTree[sub].grade === 'X') {
            // console.log(stdTree[sub]);
            return false; 
        }
    
        if(!SubjectVerification(sub, courseTree, stdTree)) {
            return false
        }

    }

    return true;
}