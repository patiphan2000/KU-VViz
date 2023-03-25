function getListFromTree(tree) {
    var result = []

    for (let sub in tree) {
        result.push(
            {
                id: sub,
                subject_code: sub.replace(/\D/g,''),
                subject_name_en: tree[sub].subject_name_en,
                subject_name_th: tree[sub].subject_name_th,
                level: tree[sub].level,
                layer: tree[sub].layer,
                pre_subject: tree[sub].pre_subject,
                next: tree[sub].next,
                grade: tree[sub].grade != undefined? tree[sub].grade:'X',
                grouping_data: tree[sub].grouping_data
            }
        )
    }
    // console.log(result);

    return result;

}

export {getListFromTree}