function compareAcadData(a, b) {
    var [yearA, semA] = a.academicYear.split('/');
    var [yearB, semB] = b.academicYear.split('/');
    if (parseInt(yearA) < parseInt(yearB)) {
        return -1;
    }
    else if (parseInt(yearA) > parseInt(yearB)) {
        return 1;
    }
    else if (parseInt(semA) < parseInt(semB)) {
        return -1;
    }
    else if (parseInt(semA) > parseInt(semB)) {
        return 1;
    }
    return 0;
}

function getLevel(stdCode, grouping_data) {
    const acadYear = (parseInt(grouping_data.split('/')[0].substring(2, 4)));
    const acadSem = (parseInt(grouping_data.split('/')[1]));
    const stdYear = (parseInt(stdCode.substring(0, 2)));
    // console.log(stdYear + " " + acadYear + " " + acadSem);
    return ((acadYear - stdYear) * 3) + acadSem - 1
}

// set layer with no smoothness
function setLayer(head, layerCounter, stdTree) {
    var q = [head];
    while (q.length > 0) {
        if (q[0].next.length > 0) {
            for (let i in q[0].next) {
                q.push(stdTree[q[0].next[i]]);
            }
        }
        if (stdTree[q[0].id].layer == -1) {
            stdTree[q[0].id].layer = layerCounter[q[0].level];
            layerCounter[q[0].level]++;
        }
        q.shift();
    }
}

function getStdTree(courseTree, gradeData, enrollData) {

    // copy course tree
    var stdTree = JSON.parse(JSON.stringify(courseTree));
    // sort by academic year
    const gradeList = gradeData.sort(compareAcadData);
    const enrollList = enrollData;

    // if student has no record yet return the course tree 
    if (gradeList.length <= 0) {
        return stdTree;
    }

    const stdCode = gradeList[0].grade[0].std_code;

    var misSubject = [];
    var pasSubject = [];
    var misSubCounter = {};
    var headList = {};

    var latestYear = -1;
    var latestSem = -1;

    for (let acad in gradeList) {
        const acadTimeline = gradeList[acad].academicYear;

        // get latest year & sem to add N subject later
        const thisAcadYear = parseInt(gradeList[acad].academicYear.split('/')[0])
        const thisAcadSem = parseInt(gradeList[acad].academicYear.split('/')[1])
        if (thisAcadYear > latestYear) {
            latestYear = thisAcadYear;
            latestSem = thisAcadSem;
        }

        const subjects = gradeList[acad].grade;
        
        for (let sub in subjects) {
            const currSub = subjects[sub];
            const currCode = currSub.subject_code;

            // check F, W and NP
            const missGrade = ['F', 'W', 'NP'];
            if (missGrade.includes(currSub.grade)) {
                misSubject.push({
                    id: currSub.subject_code,
                    subject_code: currSub.subject_code,
                    subject_name_en: currSub.subject_name_en,
                    subject_name_th: currSub.subject_name_th,
                    pre_subject: currSub.pre_subject,
                    grouping_data: currSub.grouping_data,
                    next: currSub.next,
                    level: getLevel(stdCode, currSub.grouping_data),
                    layer: -1,
                    grade: currSub.grade,
                    depth: 1
                });
                misSubCounter[currSub.subject_code] = 0
                // skip
                continue;
            }

            // check pass subject
            if (currSub.grade == 'P') {
                pasSubject.push(currSub);
                // skip
                // continue;
            }

            // check if subject is in the course
            if (stdTree[currCode]) {
                // update new data
                stdTree[currCode].id = currSub.subject_code;
                stdTree[currCode].grade = currSub.grade;
                stdTree[currCode].grouping_data = currSub.grouping_data;
                stdTree[currCode].level = getLevel(stdCode, currSub.grouping_data)
                stdTree[currCode].layer = -1
            } 
            else {
                // console.log(currSub.subject_name_en);
                stdTree[currCode] = {
                    id: currSub.subject_code,
                    subject_code: currSub.subject_code,
                    subject_name_en: currSub.subject_name_en,
                    subject_name_th: currSub.subject_name_th,
                    pre_subject: [],
                    grouping_data: currSub.grouping_data,
                    next: [],
                    level: getLevel(stdCode, currSub.grouping_data),
                    layer: -1,
                    grade: currSub.grade,
                    depth: 1
                }
            }
            if (stdTree[currCode].pre_subject.length <= 0) {
                headList[currCode] = stdTree[currCode];
            }
        }
    }
    

// add miss grade subject ---------------------------------------------------
    for (let sub in misSubject) {
        const currSub = misSubject[sub];
        const rootSubCode = currSub.subject_code;

        // get new code for this node & get prev code
        const newCode = rootSubCode + '-' + misSubCounter[rootSubCode];

        stdTree[newCode] = {
            id: newCode,
            subject_code: currSub.subject_code,
            subject_name_en: currSub.subject_name_en,
            subject_name_th: currSub.subject_name_th,
            pre_subject: stdTree[rootSubCode].pre_subject,
            grouping_data: currSub.grouping_data,
            next: [rootSubCode],
            level: getLevel(stdCode, currSub.grouping_data),
            layer: -1,
            grade: currSub.grade,
            depth: 1
        };

        stdTree[rootSubCode].pre_subject = [newCode];

        // if more than one miss grade modify prev miss grade
        if (misSubCounter[rootSubCode] > 0) {
            var prevCode = rootSubCode + '-' + (misSubCounter[rootSubCode]-1);
            stdTree[prevCode].next = [newCode];
        }
        // the first miss grade add to head list
        else {
            headList[newCode] = stdTree[newCode];
        }

        misSubCounter[rootSubCode] += 1;
    }

    // add current enroll subject ------------------------------------------------
    const currEnroll = enrollData ;
    var newGroupData = '';

    var maxLevel = 0; // use to shift unfinish subject later

    if (latestSem == 1) {
        newGroupData = latestYear + '/2'
    }
    else if(latestSem == 0) {
        newGroupData = (latestYear + 1) + '/0' // latest sem is summer
    }
    else {
        newGroupData = (latestYear + 1) + '/1'
    }
    
    for (let sub in currEnroll) {
        const subCode = currEnroll[sub].subject_code.split('-')[0];
        if (stdTree[subCode]) {
            stdTree[subCode].grouping_data = newGroupData;
            stdTree[subCode].level = getLevel(stdCode, newGroupData);
            maxLevel = stdTree[subCode].level;
            stdTree[subCode].grade = 'N'

            if (stdTree[subCode].pre_subject.length <= 0) {
                headList[subCode] = stdTree[subCode];
            }
        }
    }

    // assign id for every subject & shift all the unfinish class to next layer
    for (let sub in stdTree) {
        stdTree[sub].id = sub;
        if (stdTree[sub].grade == 'X') {
            while (stdTree[sub].level <= maxLevel) {
                stdTree[sub].level += 3;
            }
            if (stdTree[sub].pre_subject.length <= 0) { // set standalone unfinish to head
                headList[sub] = stdTree[sub]
            }

        }
    }

    // set back all the next class
    const setBack = (head) => {
        var q = [head];
        while (q.length > 0) {
            if (q[0].next.length <= 0) {
                q.shift();
                continue;
            }
            for (let i in q[0].next) {
                q.push(stdTree[q[0].next[i]])
                const currSub = stdTree[q[0].next[i]];
                if (currSub.grade == 'X' && currSub.level <= q[0].level) {
                    while (currSub.level <= q[0].level) {
                        currSub.level += 3;
                    }
                    currSub.layer = -1;
                }
            }
            q.shift()
        }
    }
    for (let sub in headList) {
        setBack(stdTree[sub]);
    }

// Define layer -----------------------------------------------------------
    
    //reset layer
    for (let sub in stdTree) {
        stdTree[sub].layer = -1;
    }


    var layerCounter = [
        0, 0, 0, 0, 
        0, 0, 0, 0, 
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0];

    // define new obj to contain added subject to add course subject first
    var addHeadList = {}
    const smootherTracker = [];

    for (let sub in headList) {

        if (!courseTree[headList[sub].subject_code]) {
            addHeadList[sub] = headList[sub];
            continue;
        }

        // if it is a single subject assign layer then skip
        if (headList[sub].pre_subject.length <= 0 && headList[sub].next.length <= 0) {
            stdTree[headList[sub].subject_code].layer = layerCounter[headList[sub].level];
            layerCounter[headList[sub].level]++;
            if (headList[sub].subject_code == "012191xx") {
                console.log(headList[sub].subject_code);
                console.log(layerCounter[headList[sub].level]);
            }
            continue;
        }

        var depth = 0
        var q = [[headList[sub], 0]]
        while (q.length > 0) {
            if (q[0][0].next.length > 0) {
                const currDepth = q[0][1] + 1
                q[0][0].next.forEach(e => {q.push([stdTree[e], currDepth])})
                depth = Math.max(depth, currDepth)
            }
            q.shift()
        }

        // 👇 Smooth the layer counter base on the size and location of current subject line
        const start = headList[sub].level;
        const stop = start + depth;
        const slice = layerCounter.slice(start, stop);
        const maxLayer = start==stop? layerCounter[start]:Math.max(...slice);
        // console.log(headList[sub].subject_name_en + " " + headList[sub].depth);
        // console.log("smooth " + start + " to " + stop + " as " + maxLayer);
        for (let step=start; step < stop; step++) {
            layerCounter[step] = maxLayer;
        }
        // console.log(layerCounter);

        setLayer(headList[sub], layerCounter, stdTree)
    }

    // set all the added subject outside course
    for (let sub in addHeadList) {

        // if it is a single subject add to tree then skip
        if (addHeadList[sub].next.length <= 0) {
            stdTree[addHeadList[sub].subject_code].layer = layerCounter[addHeadList[sub].level];
            layerCounter[addHeadList[sub].level]++;
            continue;
        }

        var depth = 0
        var q = [[headList[sub], 0]]
        while (q.length > 0) {
            if (q[0][0].next.length > 0) {
                const currDepth = q[0][1] + 1
                q[0][0].next.forEach(e => {q.push([stdTree[e], currDepth])})
                depth = Math.max(depth, currDepth)
            }
            q.shift()
        }

        // 👇 Smooth the layer counter
        const start = headList[sub].level;
        const stop = start + depth;
        const slice = layerCounter.slice(start, stop);
        const maxLayer = start==stop? layerCounter[start]:Math.max(...slice);
        for (let step=start; step < stop; step++) {
            layerCounter[step] = maxLayer;
        }
        setLayer(addHeadList[sub], layerCounter, stdTree)
    }

    // console.log(stdTree);

    return stdTree

}

export default getStdTree