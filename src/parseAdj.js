import adj from './adjecency.txt?raw';

const data = adj.split('\n')

let cursor = undefined
const finalObj = {}
for (let row of data) {

    if (row.startsWith('\t\t')) {
        finalObj[cursor].push(row.trim('\t').split('\t')[1])

    } else {
        cursor = row.split('\t')[1]
        finalObj[cursor] = []
    }
}
console.log(finalObj)