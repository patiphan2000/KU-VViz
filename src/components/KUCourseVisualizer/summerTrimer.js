function summerTrimer(tree) {
    var result = JSON.parse(JSON.stringify(tree));

    // get all level that have any class
    var ld = {}
    for (let i in result) {
        if (ld[tree[i].level] == undefined) {
            ld[tree[i].level] = 1
        }
        else {
            ld[tree[i].level] += 1
        }
    }
    
    for (let sem=20; sem>0; sem--) {
        if (ld[sem] == undefined) {
            for (let i in result) {
                if (result[i].level > sem) {
                    result[i].level = result[i].level - 1;
                }
            }
        }
    }

    return result
}

export {summerTrimer}