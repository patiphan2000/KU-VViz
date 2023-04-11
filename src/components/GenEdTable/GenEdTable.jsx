import React from 'react';
import styles from './GenEdTable.module.css'

function getGradeColor(grade) {
    if (grade == 'N') { return '#FFD950'; }
    if (['F', 'NP', 'W'].includes(grade)) { return '#d9534f'; }
    return '#02BC77';
}

export default function GenEdTable({genEdList}) {
    const listComponent = [];
    for (let i in genEdList) {
        const currGroup = genEdList[i];
        const group_name = currGroup.group_name;
        const genEdCom = (
            <div key={group_name} className={`${styles.group_container} ${styles.column}`}>
                <div 
                className={`${styles.group_head} ${styles.row}`}
                style={{
                    backgroundColor: (currGroup.credit_curr >= currGroup.credit_require)? '#02BC77':'#28c3d7'
                }}
                >
                    <div className={styles.group_title}>{group_name}</div>
                    <div 
                    name="credit_sec"
                    className={`${styles.row} ${styles.gap5} ${styles.credit_sec}`} 
                    onMouseOver={() => {
                        const labels = document.getElementsByName(group_name+"credit_label");
                        for (let i in labels) {
                            try{
                                labels[i].classList.remove(styles.hide);
                            }
                            catch {}
                        }
                    }}
                    onMouseLeave={() => {
                        const labels = document.getElementsByName(group_name+"credit_label");
                        for (let i in labels) {
                            try{
                                labels[i].classList.add(styles.hide);
                            }
                            catch {}
                        }
                    }}>
                        <div name={group_name+"credit_label"} className={`${styles.credit_label} ${styles.hide}`}>เรียนแล้ว</div>
                        <div>
                            <span style={{ color: (currGroup.credit_curr >= currGroup.credit_require)? '#02BC77':'#b2bcc8' }}>
                                {currGroup.credit_curr}
                            </span>
                        </div>
                        <div name={group_name+"credit_label"} className={`${styles.credit_label}`}>หน่วยกิต</div>
                        <div>/</div>
                        <div name={group_name+"credit_label"} className={`${styles.credit_label} ${styles.hide}`}>จากทั้งหมด</div>
                        <div>{currGroup.credit_require}</div>
                        <div name={group_name+"credit_label"} className={`${styles.credit_label} ${styles.hide}`}>หน่วยกิต</div>
                    </div>
                </div>
                <div className={`${styles.group_subjects} ${styles.column}`}>
                    {currGroup.subject_list.map((e) => {
                        return (
                            <div 
                            key={e.subject_code}
                            className={`${styles.subject} ${styles.row}`}
                            >
                                <div style={{marginLeft: '7px'}}>{e.subject_code}</div>
                                <div className={styles.subject_name}>
                                    {e.subject_name_th}
                                </div>
                                <div>{e.credit}</div>
                                <div style={{
                                    marginRight: '7px',
                                    color: getGradeColor(e.grade)
                                }}>{e.grade}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
        listComponent.push(genEdCom);
    }

    return (
        <div className={styles.genEd_container}>
            {listComponent.map((e) => {
                return e;
            })}
        </div>
    )
}