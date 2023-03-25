function getLinkPreData(data, nodeW, nodeH) {
    var linkData = []
    for (let curr in data) {
        for (let subject in data[curr].pre_subject) {
            const preCode = data[curr].pre_subject[subject]
            var target = [((data[preCode].level)*nodeW*2)+nodeW, ((data[preCode].layer + 1)*nodeH*1.75) + (nodeH/2)]
            var source = [(data[curr].level)*nodeW*2, ((data[curr].layer + 1)*nodeH*1.75) + (nodeH/2)]
            if (data[curr].level%2 == 0) { source[1] -= (nodeH/2) }
            if (data[preCode].level%2 == 0) { target[1] -= (nodeH/2) }
            linkData.push(
                {
                source: source,
                target: target,
                dist: Math.abs(data[preCode].level - data[curr].level)
                }
            )
        }
    }
    return linkData
};

function getLinkNextData(data, nodeW, nodeH) {
    var linkData = []
    for (let curr in data) {
        for (let subject in data[curr].next) {
            const nextCode = data[curr].next[subject]
            var target = [(data[nextCode].level)*nodeW*2, ((data[nextCode].layer + 1)*nodeH*1.75) + (nodeH/2)]
            var source = [((data[curr].level)*nodeW*2+nodeW), ((data[curr].layer + 1)*nodeH*1.75) + (nodeH/2)]
            if (data[curr].level%2 == 0) { source[1] -= (nodeH/2) }
            if (data[nextCode].level%2 == 0) { target[1] -= (nodeH/2) }
            linkData.push(
                {
                source: source,
                target: target,
                dist: Math.abs(data[nextCode].level - data[curr].level)
                }
            )
        }
    }
    return linkData
};

export {getLinkPreData, getLinkNextData}