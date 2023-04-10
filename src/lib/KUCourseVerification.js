import { default as getCourseTree } from '../components/KUCourseVisualizer/courseTreeGen'
import { default as getStdTree } from '../components/KUCourseVisualizer/stdTreeGen'

export function subjectVerification(
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
        if (!stdTree[currSub.co_subject[i]]) { // if co subject does not exist then skip
            continue; 
        }
        var check = !threshold.includes(stdTree[currSub.co_subject[i]].grade);
        isValid = isValid || (check);
    }

    return isValid;
}

export function courseVerification(courses, stdGrade, stdEnroll, genEdList) {
    const courseTree = getCourseTree(courses);
    const stdTree = getStdTree(courseTree, stdGrade, stdEnroll);
    var isValid = true;
    var requireSubResult = {}
    var genEdResult = {}

    // console.log(stdTree);
    for (let sub in stdTree) {
        if (stdTree[sub].grade === 'X') {
            // console.log(stdTree[sub]);
            isValid = false;
            continue;
        }

        if(!subjectVerification(sub, courseTree, stdTree)) {
            isValid = false;
            requireSubResult[sub] = stdTree[sub];
        }

        for (let i in genEdList) {
            if (stdTree[sub].subject_code == genEdList[i].subject_code) {
                const group_sub = genEdList[i].group_name_th;
                if (!genEdResult[group_sub]) {
                    // console.log(stdTree);
                    genEdResult[group_sub] = {
                        credit_require: genEdList[i].credit_min,
                        credit_curr: stdTree[sub].credit,
                        subject_list: [stdTree[sub]]
                    };
                }
                else {
                    genEdResult[group_sub].subject_list.push(stdTree[sub]);
                    genEdResult[group_sub].credit_curr += stdTree[sub].credit;
                }
                break;
            }
        }
    }

    for (let group in genEdResult) {
        const curr_group = genEdResult[group]
        if (curr_group.credit_curr < curr_group.credit_require) {
            isValid = false;
        }
    }

    return {
        status: isValid,
        require_subject: requireSubResult,
        genEd: genEdResult
    };
}

