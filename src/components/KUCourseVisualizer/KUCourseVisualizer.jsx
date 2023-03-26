import React from 'react';
import * as d3 from 'd3'
import { useEffect, useState, useRef } from 'react';

import getCourseTree from './courseTreeGen';
import getStdTree from './stdTreeGen';
import {getListFromTree}  from './treeListConverter';
import { getLinkPreData, getLinkNextData } from './getLinkData';
import { summerTrimer } from './summerTrimer';

// import styles from './KUCourseVisualizer.module.css'
import SearchBar from '../SearchBar/SearchBar';
import ZoomBar from '../ZoomBar/ZoomBar';

import styles from './KUCourseVisualizer.module.css'

const nodeWidth = 120;
const nodeHeight = 80;

var isDown = false;
var isDrag = false;
var scrollY;
var scrollX;

var acadYearList = [];

function getPLainDimension(level, scale) {
    const width = (nodeWidth * 2) * level;
    const scaleCap = (scale>99)? 99:scale;
    const multiplier = (100 - scaleCap) / 10;
    const scaler = ((101 - scaleCap) / 100);
    return {
        "viewBox": (0 - (nodeWidth/2)) + " 0 " + (width * scaler) + " " + (width * 1.9 * scaler),
        "viewPortWidth": width * 1.9,
        "viewPortHeight": width * 1,
    }
}

function getNodeColor(d) {
    if (d.grade=='X') {return '#8897aa'}
    if (d.grade=='P') {return '#28c3d7'}
    if (d.grade=='N') {return '#FFD950'}
    // if (d.next.length > 2) {return '#cb473f'}
    if (d.next.length == 0) {return '#02bc77'}
    return '#03a96b'
}

function getNodePosition(d) {
    var x = (d['level']) * nodeWidth * 2
    var y = (d['layer'] + 1) * nodeHeight * 1.75

    if (d.level%2 == 0) {
        y -=  nodeHeight/2
    }

    return [x, y]
}

function createNode(svgElement, dataset, focusData, onClickFunc) {
    svgElement.selectAll("*").remove();

    svgElement.selectAll("rect")
    .data(dataset)
    .join("rect")
    .attr("class", `${styles.sub_node} ${styles.node_shadow}`)
    .attr("x", d => getNodePosition(d)[0])
    .attr("y", d => getNodePosition(d)[1])
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("opacity", "25%")
    .on("click", function(d, i) {
        onClickFunc(i);
    })
    .filter(function(d) { 
        // console.log(d);
        return (!focusData.includes(d)); 
    })
    .attr("opacity", "25%");
}

function createLink(svgElement, dataset, isFocus, isShowLink) {
    var linkGen = d3.linkHorizontal();
    svgElement.selectAll("*").remove();
    svgElement.selectAll("path")
    .data(dataset)
    .join("path")
    .attr("id", "links")
    .attr("d", linkGen)
    .attr("fill", "none")
    .attr("stroke", function(d) {
        const linkColor = [
            '#42d6a4',
            '#f8f38d',
            '#ffb480',
            '#ff6961'];
        if (isFocus) {
            return linkColor[(d.dist > 5)? 4:d.dist-1]
        }
        return "gray"
    })
    .attr("stroke-width", "3")
    .attr("opacity", (d) => {
        if (isFocus) { return '100%' }
        if (isShowLink) { return '0%' }
        else { return '20%' }
    })
    .attr("stroke-dasharray", function() {
        const length = this.getTotalLength()
        return `${length} ${length}`
    })
    .attr("stroke-dashoffset", function() {
        return this.getTotalLength()
    })
    .transition()
    .duration(450)
    .attr("stroke-dashoffset", 0);
}

function addAcadYearBtn(dataset, filter, setFilter, updateFilter) {
    const container = d3.select("#filterAcadyear")
    container.selectAll("button")
    .data(dataset)
    .join("button")
    .attr("class", (d) => {
        if (d.includes("ชั้นปี") && (d.split(' ')[1]+'/') == filter.academicYear) {
            return `${styles.btn} ${styles.btn_secondary} ${styles.btn_selected}`
        }
        if ((d.split(' ')[0]+'/') == filter.academicYear) {
            return `${styles.btn} ${styles.btn_secondary} ${styles.btn_selected}`
        }
        return `${styles.btn} ${styles.btn_secondary}`
    })
    .attr('id', d => 'btn-' + d)
    .on("click", function(d, i) {
        var key = i;
        if (i.includes("ชั้นปี")) {
            key = i.split(' ')[1]
        }
        key += '/'
        var newFilter = filter;
        newFilter.academicYear = key;
        setFilter(newFilter);
        updateFilter();
    })
    .html(d => d);
}

function addAcadSemBtn(dataset, filter, setFilter, updateFilter) {
    const container = d3.select("#filterSem")
    container.selectAll("button")
    .data(dataset)
    .join("button")
    .attr("class", (d) => {
        if (filter.academicYear == '') { return `${styles.btn} ${styles.btn_secondary} ${styles.btn_disabled}` }
        var key;
        if (d == 'ภาคต้น') { key = '/1' }
        else if (d == 'ภาคปลาย') { key = '/2' }
        else if (d == 'ภาคฤดูร้อน') { key = '/0' }
        else {  key = ''}
        if (key == filter.semester) {
            return `${styles.btn} ${styles.btn_secondary} ${styles.btn_selected}`
        }
        return `${styles.btn} ${styles.btn_secondary}`
    })
    .attr('id', d => 'btn-' + d)
    .on("click", function(d, i) {
        var key;
        if (i == 'ภาคต้น') { key = '/1' }
        else if (i == 'ภาคปลาย') { key = '/2' }
        else if (i == 'ภาคฤดูร้อน') { key = '/0' }
        else {  key = ''}
        var newFilter = filter;
        newFilter.semester = key;
        setFilter(newFilter);
        updateFilter();
    })
    .html(d => d);
}

function createNodeLabel(svgElement, dataset, focusData, isCourseView) {
    svgElement.select("#sub-code-sec-clip").selectAll("clipPath")
    .data(dataset)
    .join("clipPath")
    .attr("id", d => "rounded-clip" + d.level + d.layer)
    .attr("opacity", "100%")
    .html(d =>
        `<rect x=\"${getNodePosition(d)[0]}\" y=\"${getNodePosition(d)[1]}\" width=\"${nodeWidth}\" height=\"${nodeHeight+5}\" rx=\"5\" ry=\"5\"/>`
    );

    svgElement.select("#sub-code-sec").selectAll("rect")
    .data(dataset)
    .join("rect") 
    .attr("class", styles.sub_code_rect)
    .attr("id", d => "subject-code-rec" + d.level + d.layer)
    .attr("x", d => getNodePosition(d)[0])
    .attr("y", d => getNodePosition(d)[1])
    .attr("width", nodeWidth)
    .attr("height", nodeHeight/4)
    .attr("opacity", "100%")
    .attr("fill", (d) => { return getNodeColor(d) })
    // .attr("stroke-width", "0.5")
    .attr("clip-path", d => "url(#rounded-clip" + d.level + d.layer + ")") // clip round rect
    .filter(function(d) { return (!focusData.includes(d)); })
    .attr("opacity", "25%");

    svgElement.select("#sub-code").selectAll("text")
    .data(dataset)
    .join("text") 
    .attr("class", `${styles.label} ${styles.label_normal} ${styles.label_noclick}`)
    .attr("id", "subject-detail")
    .attr("x", d => getNodePosition(d)[0])
    .attr("y", d => getNodePosition(d)[1] + 3)
    .attr("dy", "1.2em")
    .attr("dx", "0.5em")
    .attr("opacity", "100%")
    .text(function (d) {return d.subject_code})
    .filter(function(d) { return (!focusData.includes(d)); })
    .attr("opacity", "25%");

    svgElement.select("#sub-name").selectAll("foreignObject")
    .data(dataset)
    .join("foreignObject") 
    .attr("class", styles.labcontainer)
    .attr("id", "subject-detail")
    .attr("x", d => getNodePosition(d)[0])
    .attr("y", d => getNodePosition(d)[1]+(nodeHeight*0.2))
    // .attr("width", viewCourse? nodeWidth:nodeWidth*0.75)
    // .attr("width", viewCourse? nodeWidth*0.75:nodeWidth)
    .attr("width", isCourseView? nodeWidth:nodeWidth*0.75)
    .attr("height", nodeHeight*0.7)
    .attr("padding-top", '20px')
    .attr("opacity", "100%")
    .attr("text-align", "left")
    .html(function (d) {
        let result = `<div class=${styles.lab_text_name}><p class=${styles.name_th}>`+ d.subject_name_th + '</p>'
        result += `<p class=${styles.name_en}>`+ d.subject_name_en + '</p></div>'
        return result
    })
    .filter(function(d) { return (!focusData.includes(d)); })
    .attr("opacity", "25%");
    // .transition()
    // .duration(500)
    // .attr("width", viewCourse? nodeWidth:nodeWidth*0.75)

    svgElement.select("#sub-grade").selectAll("text")
    .data(dataset)
    .join("text") 
    .attr("class", `${styles.label} ${styles.label_normal} ${styles.label_noclick}`)
    .attr("id", "subject-detail")
    .attr("x", d => getNodePosition(d)[0] + nodeWidth*0.85)
    .attr("y", d => getNodePosition(d)[1] + nodeHeight*0.65)
    .attr("dy", "0em")
    .attr("dx", "0em")
    .attr("opacity", "100%")
    // .text(function (d) {return d.level })
    .text(function (d) {return d.grade == 'X'? '': d.grade})
    .filter(function(d) { return (!focusData.includes(d)); })
    .attr("opacity", "25%");

}

function createSemSeparator(svgElement, stdData, isCourseView, semColor) {

        var dataset = [];
        
        if (isCourseView) { // view course
            for (let i in [1, 2, 3, 4, 5, 6, 7, 8]) {
                dataset.push({
                    text: 'ชั้นปีที่ ' + (parseInt(i)+1) + ' ภาคต้น',
                    color: semColor['1']
                });
                dataset.push({
                    text: 'ชั้นปีที่ ' + (parseInt(i)+1) + ' ภาคปลาย',
                    color: semColor['2']
                })
            }
            acadYearList = ['ชั้นปีที่ 1', 'ชั้นปีที่ 2', 'ชั้นปีที่ 3', 'ชั้นปีที่ 4']
        }
        else {
            var maxYear = 0;
            var latestSem = 0;
            acadYearList = [];
            for (let sub in stdData) {
                const acadYear = stdData[sub].academicYear;
                maxYear = Math.max(parseInt(acadYear.split('/')[0]), maxYear);
                latestSem = parseInt(acadYear.split('/')[1]);
                var text;
                if (acadYear.split('/')[1] == '0') { // if it is summer
                    text = 'ภาคฤดูร้อน'
                }
                else {
                    text = 'ปีการศึกษา ' + acadYear.split('/')[0]
                    text += (acadYear.split('/')[1] == '1')? ' ภาคต้น':' ภาคปลาย'
                }
                dataset.push({
                    text: text,
                    color: semColor[acadYear.split('/')[1]]
                })
                if (!acadYearList.includes(acadYear.split('/')[0])) {  // if year not in list, push
                    acadYearList.push(acadYear.split('/')[0]);
                }
            }
            const listNum = [1, 2, 3, 4, 5, 6, 7, 8]
            // console.log(maxYear);
            // console.log(latestSem);
            if (latestSem < 2) {
                dataset.push({
                    text: text = 'ปีการศึกษา ' + (maxYear) + ' ภาคปลาย',
                    color: semColor['2']
                })
            }
            for (let i in listNum) {
                dataset.push({
                    text: text = 'ปีการศึกษา ' + (maxYear + listNum[i]) + ' ภาคต้น',
                    color: semColor['1']
                });
                dataset.push({
                    text: text = 'ปีการศึกษา ' + (maxYear + listNum[i]) + ' ภาคปลาย',
                    color: semColor['2']
                })
            }
        }

        svgElement.selectAll("rect")
        .data(dataset)
        .join("rect")
        .attr("class", styles.sem_bg)
        .attr("x", function(d,i) {
            return (i*nodeWidth*2)-(nodeWidth/2)
        })
        .attr("y", 0)
        .attr("width", nodeWidth*2)
        .attr("height", nodeWidth*20)
        .attr("fill", d => d.color)
        .attr("opacity", "100%")
        .on('click', function (d, i) {
            // if (isFocus && !isDrag) {
            //     setIsFocus(false)
            //     resetLink(dataset)
            // }
        });
        
        svgElement.selectAll("text")
        .data(dataset)
        .join("text") 
        .attr('class', styles.sem_text_th)
        .attr("id", "academic-year")
        .attr("x", function(d,i) { 
            return ((i) * (nodeWidth*2)) - (nodeWidth/3)
        })
        .attr("y", nodeHeight/4)
        .attr("dy", "0em")
        .attr("dx", "0em")
        .attr("opacity", "100%")
        .text(d => d.text);
}

function KUCourseVisualizer({course, 
    stdGrade = [], 
    stdEnroll = [], 
    semColor = {
    '0': "#ffe8c4",
    '1': "#e3e3e3",
    '2': "#f5f5f5"
    },
    lang = 'TH'
}) {

    const [graphScale, setGraphScale] = useState(75);
    const setScale = (value) => {
        setGraphScale(value);
    }

    const courseTree = getCourseTree(course);
    const stdTree = getStdTree(courseTree, stdGrade, stdEnroll);

    const courseList = getListFromTree(summerTrimer(courseTree));
    const stdGradeList = getListFromTree(summerTrimer(stdTree));

    const ref = useRef()

    const [currentData, setCurrentData] = useState(courseList);

    const [focusHead, setFocusHead] = useState([]);
    const [focusData, setFocusData] = useState(courseList);
    const [isFocus, setIsFocus] = useState(false);

    const [filter, setFilter] = useState({
        "academicYear": '',
        "semester": '',
        "keyword": ''
    })

    const [preLink, setPreLink] = useState(getLinkPreData(summerTrimer(courseTree), nodeWidth, nodeHeight));
    const [nextLink, setNextLink] = useState([]);

    const [isCourseView, setCourseView] = useState(true);

    const [isShowLink, setIsShowLink] = useState(false);

    // set course or std view and reset
    const setIsCourseView = (value) => {
        setCourseView(value);
        if (value) {
            setCurrentData(courseList);
            setFocusData(courseList)
            setPreLink(getLinkPreData(summerTrimer(courseTree), nodeWidth, nodeHeight));
            setNextLink([]);
        }
        else {
            setCurrentData(stdGradeList);
            setFocusData(stdGradeList);
            setPreLink(getLinkPreData(summerTrimer(stdTree), nodeWidth, nodeHeight));
            setNextLink([]);
        }
        setIsFocus(false);
    };

    const filterByKey = (key) => {
        var newFil = filter;
        newFil.keyword = key;
        setFilter(newFil);

        updateFilter()
    }

    const updateFilter = () => {
        var focusList = []

        const year = filter.academicYear;
        const sem = filter.semester;
        const key = filter.keyword;

        for (let sub in currentData) {
            if ( 
                currentData[sub].subject_code.includes(key) ||
                currentData[sub].subject_name_en.includes(key) ||
                currentData[sub].subject_name_th.includes(key) ||
                key == ''
                ) {
                    if (!(currentData[sub].grouping_data.includes(year) || year == '')) {
                        continue;
                    }
                    if (!(currentData[sub].grouping_data.includes(sem) || sem == '')) {
                        continue;
                    }
                    focusList.push(currentData[sub]);
                }
            
        }
        setFocusData(focusList);
        setPreLink([])
        setNextLink([])
    }

    const clearFilter = () => {
        setFilter({
            "academicYear": '',
            "semester": '',
            "keyword": ''
        });
        updateFilter();
        setFocusData(currentData);
        setIsCourseView(isCourseView);
    }

    // clearFilter()  // initially clear link line

    // Handle drag to scroll
    const [globalmousePos, setGlobalMousePos] = useState({});
    const [localMousePos, setLocalMousePos] = useState({});  

    const handleMouseDown = (e) => {
        var c = document.getElementById('chart-container')

        setLocalMousePos({ x: globalmousePos.x, y: globalmousePos.y });

        scrollX = c.scrollLeft
        scrollY = c.scrollTop
    
        isDown = true;
    };

    const handleMouseDrag = (e) => {
        if (isDown) {
            isDrag = true;
            var c = document.getElementById('chart-container')
            const x = e.pageX 
            const y = e.pageY
            const walkX = localMousePos.x - x
            const walkY = localMousePos.y - y
            var limitY = graphScale>50? 36*graphScale:18*graphScale;
            var limitX = graphScale>50? 64*graphScale:36*graphScale;
            c.scrollTop = walkY + scrollY;
            c.scrollLeft = walkX + scrollX;
            // console.log(c.scrollTop);
            d3.select("#sem-separators").selectAll('rect').attr("cursor", 'grabbing')
        }
    }

    const handleMouseUp = (e) => {
        isDown = false;
        setTimeout(() => {
            isDrag = false;
            d3.select("#sem-separators").selectAll('rect').attr("cursor", 'grab')
        }, 1);
    }
    // END HANDLE DRAG TO SCROLL

    useEffect(() => {
        
        // Get plain svg
        const svgElement = d3.select(ref.current);
    
        // append group for each element in svg
        if (document.getElementById("#bgPlain")) {
            
        }
        else {
            svgElement.selectAll("g").remove();
            svgElement.append("g").attr("id", "bgPlain");
            svgElement.append("g").attr("id", "sem-separators");
            svgElement.append("g").attr("id", "links");
            
            svgElement.select("#links").append("g").attr("id", "link-pre");
            svgElement.select("#links").append("g").attr("id", "link-next");
            
            svgElement.append("g").attr("id", "nodes");

            svgElement.select("#nodes").append("g").attr("id", "nodes-body");

            svgElement.select("#nodes").append("g").attr("id", "labels");
            svgElement.select("#labels").append("g").attr("id", "sub-code-sec-clip");
            svgElement.select("#labels").append("g").attr("id", "sub-code-sec");
            svgElement.select("#labels").append("g").attr("id", "sub-code");
            svgElement.select("#labels").append("g").attr("id", "sub-name");
            svgElement.select("#labels").append("g").attr("id", "sub-grade");
        
        }

        var nodes = svgElement.select("#nodes");
        var nodeBody = nodes.select("#nodes-body");
        nodeBody.selectAll("rect")
        .data(currentData)
        .join("rect")
        .attr("class", `${styles.sub_node} ${styles.node_shadow}`)
        .attr("x", d => getNodePosition(d)[0])
        .attr("y", d => getNodePosition(d)[1])
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("opacity", "100%")
        .on("click", function(d, i) { // set focus & pre, next link
            const node = i;
            var focusList = [node];

            // get pre link tree
            var preTree = {};
            preTree[node.id] = node;
            var q = [node];
            while(q.length > 0) {
                if (q[0].pre_subject.length > 0) {
                    for (let i in currentData) {
                        if (q[0].pre_subject.includes(currentData[i].id)) {
                            q.push(currentData[i]);
                            preTree[currentData[i].id] = currentData[i];
                            focusList.push(currentData[i]);
                        }
                    }
                }
                q.shift();
            }

            // get next link tree
            var nextTree ={};
            nextTree[node.id] = node;
            var q = [node];
            while(q.length > 0) {
                if (q[0].next.length > 0) {
                    for (let i in currentData) {
                        if (q[0].next.includes(currentData[i].id)) {
                            q.push(currentData[i]);
                            nextTree[currentData[i].id] = currentData[i];
                            focusList.push(currentData[i]);
                        }
                    }
                }
                q.shift();
            }

            setPreLink(getLinkPreData(preTree, nodeWidth, nodeHeight));
            setNextLink(getLinkNextData(nextTree, nodeWidth, nodeHeight));
            
            // 👇 set focus data
            setFocusData(focusList);
            setIsFocus(true);
            // console.log(focusData);
        })
        .filter(function(d) { 
            // console.log(d);
            return (!focusData.includes(d)); 
        })
        .attr("opacity", "25%");

        var nodeLabels = svgElement.select("#nodes").select("#labels");
        createNodeLabel(nodeLabels, currentData, focusData, isCourseView);

        var linkPre = svgElement.select("#links").select("#link-pre")
        var linkNext = svgElement.select("#links").select("#link-next")
        createLink(linkPre, preLink, isFocus, isShowLink)
        createLink(linkNext, nextLink, isFocus, isShowLink)
        
        var semSeparator = svgElement.select("#sem-separators");
        createSemSeparator(semSeparator, stdGrade, isCourseView, semColor)

        // addAcadYearBtn(acadYearList, filter, setFilter, updateFilter);
        const container = d3.select("#filterAcadyear")
        container.selectAll("button")
        .data(acadYearList)
        .join("button")
        .attr("class", (d) => {
            if (d.includes("ชั้นปี") && (d.split(' ')[1]+'/') == filter.academicYear) {
                return `${styles.btn} ${styles.btn_secondary} ${styles.btn_selected}`
            }
            if ((d.split(' ')[0]+'/') == filter.academicYear) {
                return `${styles.btn} ${styles.btn_secondary} ${styles.btn_selected}`
            }
            return `${styles.btn} ${styles.btn_secondary}`
        })
        .attr('id', d => 'btn-' + d)
        .on("click", function(d, i) {
            var key = i;
            if (i.includes("ชั้นปี")) {
                key = i.split(' ')[1]
            }
            key += '/'
            var newFilter = filter;
            newFilter.academicYear = key;
            setFilter(newFilter);
            updateFilter();
        })
        .html(d => d);
        addAcadSemBtn(['ภาคต้น', 'ภาคปลาย', 'ภาคฤดูร้อน', 'ทั้งหมด']
        , filter, setFilter, updateFilter);

        // 👇 Handle drag to scroll
        const handleMouseMove = (event) => {
            setGlobalMousePos({
                x: event.pageX,
                y: event.pageY,
            });
        };
      
        window.addEventListener('mousemove', handleMouseMove);
    
        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove
            );
        };
        // END DRAG TO SCROLL


    }, [currentData, preLink, nextLink, focusData, isCourseView, isShowLink])


    var std_btn = (isCourseView)? `${styles.btn} ${styles.btn_secondary}`:`${styles.btn} ${styles.btn_selected}`
    if (stdGrade.length <= 0) {
        std_btn = `${styles.btn} ${styles.btn_secondary} ${styles.btn_disabled}`
    }


    const filterTab = (
        <div className={styles.filter_container}>
            <div className={styles.filter_card}>
                <div className={styles.filter_block}>
                    <p className={styles.filter_label}>ตัวกรองข้อมูล</p>
                    <div className={styles.grid_2} id="filterDataView">
                        <button 
                        className={isCourseView? `${styles.btn} ${styles.btn_selected}`:`${styles.btn} ${styles.btn_secondary}`}
                        onClick={() => {
                            setIsCourseView(true);
                        }}
                        >ข้อมูลหลักสูตร</button>
                        <button 
                        className={std_btn}
                        onClick={() => {
                            setIsCourseView(false);
                        }}
                        >ข้อมูลนิสิต</button>
                    </div>
                    <ZoomBar setScale={setScale}/>
                    <div className={styles.colaps_container}>
                        <div className={styles.container_checkbox}>
                            <label className={styles.form_control}>
                                <input 
                                type="checkbox" 
                                defaultChecked={true}
                                onChange={() => {
                                    setIsShowLink(!isShowLink)
                                }}
                                />
                                แสดงเส้นวิชาตัวต่อ
                            </label>
                        </div>
                        <div className={styles.container_checkbox}>
                            <label className={styles.form_control}>
                                <input 
                                type="checkbox" 
                                defaultChecked={true}
                                onChange={() => {
                                    setIsShowLink(!isShowLink)
                                }}
                                />
                                แสดงผล F เป็นสีแดง
                            </label>
                        </div>
                        <div className={styles.container_checkbox}>
                            <label className={styles.form_control}>
                                <input 
                                type="checkbox" 
                                defaultChecked={true}
                                onChange={() => {
                                    setIsShowLink(!isShowLink)
                                }}
                                />
                                ห้ามวิชาแสดงผลพร้อมสหกิจศึกษา
                            </label>
                        </div>
                    </div>
                    <div className={styles.grid_2}>
                    </div>
                </div>
                <div className={styles.filter_block}>
                    <p className={styles.filter_label}>ปีการศึกษา</p>
                    <div className={styles.grid_3} id="filterAcadyear">
                    </div>
                </div>
                <div className={styles.filter_block}>
                    <p className={styles.filter_label}>{(lang=='TH')? 'ภาคการศึกษา':'Academic Year'}</p>
                    <div className={styles.grid_2} id="filterSem">
                    </div>
                </div>
                <div className={styles.filter_block}>
                    <p className={styles.filter_label}>ค้นหารายวิชา</p>
                    <SearchBar onChange={filterByKey}/>
                </div>
                <div style={{marginLeft: 'auto', marginRight: 0}}>
                    <button 
                    className={`${styles.btn} ${styles.btn_main}`}
                    onClick={() => {
                        clearFilter();
                    }}
                    >ล้าง</button>
                </div>
            </div>
        </div>
    )

    return (
        <div className={styles.component_container}>
            <div className={styles.row}>
                {/* <div style={{width: '1000px'}}></div> */}
            </div>
            <div className={styles.row_nowrap}>
                <div className={styles.column}>
                    <div
                        id = 'chart-container'
                        className={styles.chart_container}
                        style={{
                        overflow: 'scroll',
                        // Fix this on production
                        height: '80vh' 
                        }}
                        onMouseDown = {handleMouseDown}
                        onMouseMove = {handleMouseDrag}
                        onMouseUp = {handleMouseUp}
                    >
                        <svg
                            width={getPLainDimension(16, graphScale).viewPortWidth} 
                            height={getPLainDimension(16, graphScale).viewPortHeight}
                            // viewBox="0 0 520 320"
                            viewBox={getPLainDimension(16, graphScale).viewBox}
                            preserveAspectRatio="xMinYMin meet"
                            ref={ref}
                            overflow={"scroll"}
                            style={{
                                border: "2px solid red"
                            }}
                        />
                    </div>
                </div>
                <div className={`${styles.column} ${styles.hidden_xs}`}>
                    {filterTab}
                </div>
            </div>
            {/* <div className='row-nowrap'>
                <div className='gen-ed-conatainer'>
                    <div className='gen-ed'>
                        <div className="title">กลุ่มสาระอยู่ดีมีสุข</div>
                        <table>
                            <tr>
                                <th>รหัสวิชา</th>
                                <th>ชื่อวิชา</th>
                                <th>หน่วยกิต</th>
                            </tr>
                            <tr>
                                <td>01999011</td>
                                <td>อาหารเพื่อมนุษยชาติ</td>
                                <td>3</td>
                            </tr>
                        </table>
                        <div className='gen-ed-cetegory-container'>
                            <div className='gen-ed-card'>
                                <div className="lab-text-normal"><p className="text-normal">อาหารเพื่อมนุษยชาติ</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    )
        
}

export default KUCourseVisualizer