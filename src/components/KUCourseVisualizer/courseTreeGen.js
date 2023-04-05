function getLevel(grouping_data) {
    const year = parseInt(grouping_data.split('/')[0])
    const sem = parseInt(grouping_data.split('/')[1])
    return ((year - 1) * 3) + sem - 1
}

function getCourseTree(data) {
    const subjectList = data

    var layerCounter = [
        0, 0, 0, 0, 
        0, 0, 0, 0, 
        0, 0, 0, 0, 
        0, 0, 0, 0];

    var headList = {};
    var courseTree = {};

    for (let indexSub in subjectList) {
        const currSub = subjectList[indexSub]
        courseTree[currSub.subject_code] = {
            id: currSub.subject_code,
            subject_code: currSub.subject_code,
            subject_name_en: currSub.subject_name_en,
            subject_name_th: currSub.subject_name_th,
            pre_subject: currSub.pre_subject,
            co_subject: (currSub.co_subject)? currSub.co_subject:[],
            grouping_data: currSub.grouping_data,
            next: [],
            level: getLevel(currSub.grouping_data),
            layer: -1,
            grade: 'X',
            depth: 0
        };
    }

    // HOT FIX: clean loss subject from pre_subject
    for (let indexSub in subjectList) {
        const currSub = subjectList[indexSub]
        var pre_list = courseTree[currSub.subject_code].pre_subject;
        for (let s in courseTree[currSub.subject_code].pre_subject) {
            let sub_id = courseTree[currSub.subject_code].pre_subject[s];
            // console.log(courseTree[currSub.subject_code].pre_subject[s]);
            if (!courseTree[sub_id]) {
                const index = pre_list.indexOf(sub_id);
                pre_list.splice(index, 1);
            }
        }
        courseTree[currSub.subject_code].pre_subject = pre_list;
    }

    for (let indexSub in subjectList) {
        const currSub = subjectList[indexSub]

        // If no pre then add to be head of the tree
        if (currSub.pre_subject.length <= 0) {
            headList[currSub.subject_code] = courseTree[currSub.subject_code]
            continue;
        }

        // Assign next to all pre subject
        var depthList = [];
        currSub.pre_subject.forEach(p => { 
            if (courseTree[p]) {  
                courseTree[p].next.push(currSub.subject_code);
                // add depth to find max depth later
                depthList.push(courseTree[p].level)
            }
        });
        courseTree[currSub.subject_code].depth = (Math.max(...depthList)) + 1

    } // END LOOP ADD EACH SUBJECT IN TREE

    // find max depth in every head
    for (let id in headList) {
        var q = [courseTree[id]]
        while (q.length > 0) {
            const currNode = q[0];
            for (let i in q[0].next){
                q.push(courseTree[q[0].next[i]]);
            }
            headList[id].depth = Math.max(currNode.depth, headList[id].depth);
            q.shift();
        }
    } // END FIND MAX DEPTH

    // Assign layer to every subject
    for (let id in headList) {
        // 👇 Smooth the layer counter
        const start = headList[id].level;
        const stop = start + headList[id].depth;
        const slice = layerCounter.slice(start, stop);
        const maxLayer = Math.max(...slice);
        // console.log(start + " to " + stop);
        for (let step=start; step > stop; step++) {
            layerCounter[step] = maxLayer;
        }
        // console.log(layerCounter);

        var q = [courseTree[id]]
        while (q.length > 0) {
            const currNode = q[0];
            for (let i in q[0].next){
                q.push(courseTree[q[0].next[i]]);
            }
            // if the layer is not already assign
            if (currNode.layer == -1) {
                currNode.layer = layerCounter[currNode.level];
                layerCounter[currNode.level]++;
                // console.log(layerCounter);
            }
            q.shift();
        }
        // console.log(layerCounter);
    }

    // console.log(courseTree);
    return courseTree

}

export default getCourseTree