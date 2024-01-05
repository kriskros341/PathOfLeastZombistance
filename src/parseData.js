import usCounties from './uscounties.csv?raw'

const d = usCounties.split('\r\n').slice(1).map(row => row.split(',').map(entry => entry.slice(1, -1)))
const dx = d.reduce((accumulator, current) => {
  accumulator[current[3]] = {
    'name_short': current[0],
    'name': current[2],
    'short': current[4],
    'state': current[5],
    'lon': parseFloat(current[6]),
    'lat': parseFloat(current[7]),
    'population': parseInt(current[8]),
    'id': current[3],
  }
  return accumulator
}, {})

console.log(dx)