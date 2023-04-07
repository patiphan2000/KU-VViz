import { default as getCourseTree } from '../components/KUCourseVisualizer/courseTreeGen'
import { default as getStdTree } from '../components/KUCourseVisualizer/stdTreeGen'

export function SubjectVerification(
    subject_code, courseTree, stdTree,
    threshold = ['F', 'W', 'NP', 'X']
    ) {
    var isValid = true;
    if (!stdTree[subject_code]) { 
        console.log(subject_code + " not found in stdTree");
        return false; 
    }  // if not found return false
    if (threshold.includes(stdTree[subject_code].grade)) { return false; }

    const currSub = courseTree[subject_code];
    if (!currSub) { return true; }

    // check with pre_subject
    for (let i in currSub.pre_subject) {
        var check = !threshold.includes(stdTree[currSub.pre_subject[i]].grade);
        isValid = isValid && (check);
    }

    // check with co_subject
    for (let i in currSub.co_subject) {
        var check = !threshold.includes(stdTree[currSub.co_subject[i]].grade);
        isValid = isValid || (check);
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