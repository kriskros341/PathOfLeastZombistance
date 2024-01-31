import './style.css'
import * as d3 from 'd3';
import * as topojson from 'topojson'

type SvgInHtml = HTMLElement & SVGElement;
var svg = d3.select("svg");
const svgElement: SvgInHtml = document.getElementById('map') as SvgInHtml;
const dataTable = document.getElementById("tableData")!;
const stickyCounter = document.getElementById("stickyCounter")!;
var path = d3.geoPath();

const dataJSON = fetch('./data.json').then(response => response.json());
const adjecencyJSON = fetch('./adjecencyData.json').then(response => response.json());

import PriorityQueue from './helpers/PriorityQueue';
import DefaultMap from './helpers/DefaultMap';

import CircleController from './domain/CirlceController';
import SelectionController from './domain/SelectionController';
import RouteController from './domain/RouteController';
import { throttle } from './helpers/throttle';
import { buffer } from './helpers/buffer';

let data: Record<string, any>;
let adjecency: Record<string, any>;
let features: any[] = []
let avgs: Record<string, any> = {}
let selectedCountyId = "";

const getCountoursForCounty = (countyId: string) => {
	const feature = features.find(feature => feature.id === countyId)
	const result = []
	for (let coordinates of feature.geometry.coordinates) {
		if (feature.geometry.type === 'MultiPolygon') {
			for (let coordinateSet of coordinates) {
				for (let point of coordinateSet) {
					result.push([point.x, point.y])
				}
			}
		} else {
			for (let point of coordinates) {
				result.push([point.x, point.y])
			}
		}
	}
	return result
}

const getCountiesInRadius = (cx: number, cy: number, r: number) => {
	const result: string[] = []
	if (!cx || !cy) {
		return result
	}
	for (let feature of features) {
		featurePoints: for (let coordinates of feature.geometry.coordinates) {
			if (feature.geometry.type === 'MultiPolygon') {
				for (let coordinateSet of coordinates) {
					for (let point of coordinateSet) {
						let [x, y] = point
						if (Math.hypot(x - cx, y - cy) < r) {
							result.push(feature.id)
							break featurePoints;
						}
					}
				}
			} else {
				for (let point of coordinates) {
					let [x, y] = point
					if (Math.hypot(x - cx, y - cy) < r) {
						result.push(feature.id)
						break featurePoints;
					}
				}
			}
		}
	}
	return result;
}

const bfs = (selectedCountyId: string, countyId: string) => {
	const q = new PriorityQueue<string[]>()

	const relevantAdjecency = selectionController.state.selection.reduce((accumulator, current) => {
		accumulator[current] = adjecency[current];
		return accumulator;
	}, {} as any);

	const bestPathToProvinceTrack = new DefaultMap(Infinity);

	for (let neighborId of relevantAdjecency[selectedCountyId]) {
		q.enqueue([selectedCountyId, neighborId], data[selectedCountyId].population + data[neighborId].population)
	}

	const results = [];
	const maxResults = 1;

	while (q._list.length) {
		const [path, value] = q.dequeue()!;

		const nextId = path.at(-1)!

		if (nextId === countyId) {
			bestPathToProvinceTrack.delete(nextId);
			results.push([...path]);
			if (results.length === maxResults) {
				break;
			}
		}
		if (!relevantAdjecency[path.at(-1)!]) {
			continue
		}

		for (let neighborId of relevantAdjecency[nextId]) {
			const nextValue = value + data[neighborId].population;
			if (!path.includes(neighborId) && bestPathToProvinceTrack.get(neighborId) > nextValue) {
				q.enqueue([...path, neighborId], nextValue);
				bestPathToProvinceTrack.set(neighborId, nextValue)
			}
		}
	}
	return results;
}

const pathDisplay = document.getElementById("pathDisplay")!
const pathGraph = document.getElementById("pathGraph")!

const routeController = new RouteController().setStrategy(bfs)

const updateRoute = (paths: any[][]) => {
	svg.selectAll('[data-test="line"]').remove()
	if (!paths.length) {
		pathDisplay.innerHTML = "";
		pathGraph.innerHTML = "";
		return;
	}
	for (let path of paths) {
		const coords = path.map((countyId) => avgs[countyId])
		const slidingCoords = [...toSliding2(coords)]
		svg.selectAll("line")
			.data(slidingCoords)
			.enter()
			.append("line")
			.attr('data-test', 'line')
			.attr("x1", function ([fromCountyPoint, _]) {
				return fromCountyPoint[0];
			})
			.attr("x2", function ([_, toCountyPoint]) {
				return toCountyPoint[0];
			})
			.attr("y1", function ([fromCountyPoint, _]) {
				return fromCountyPoint[1]
			})
			.attr("y2", function ([_, toCountyPoint]) {
				return toCountyPoint[1]
			})
			.attr("stroke", "red")
			.attr("stroke-width", "4")
	}
	const countiesData = paths[0].map(item => data[item])
	pathDisplay.innerHTML = countiesData.map(c => c.name).join(" -> ");
}

const radiusControllsElement: HTMLInputElement = document.querySelector('#radiusControlls')!

const selectionController = new SelectionController()
	.setStrategy(() => getCountiesInRadius(circle.state.cx, circle.state.cy, circle.state.r))

const circle = new CircleController({ r: parseInt(radiusControllsElement.value!) })

const updateSelection = (state: { selection: any[] }) => {
	if (routeController.state.to && !getCountoursForCounty(routeController.state.to).every(([x, y]) => circle.includes(x, y))) {
		svg.selectAll('[data-test="line"]').remove()
	}
	dataTable.innerHTML = ""

	const dataObjects = state.selection.map(item => data[item]).sort((a, b) => a.population - b.population)

	for (let dataObject of dataObjects) {
		const div = document.createElement('div')
		div.innerHTML = `${dataObject.name}: ${dataObject.population}`;
		div.onclick = () => {
			const paths = routeController.execute(selectedCountyId, dataObject.id)
			routeController.update({ from: selectedCountyId, to: dataObject.id, paths })
			updateRoute(paths);
		}
		dataTable.appendChild(div)
	}
	dataTable.scrollTo({ top: 0 })
	stickyCounter.innerHTML = `Count: ${dataObjects.length}`
}

const updateCircle = () => {
	svg.select('#circle')?.remove()
	svg.append('circle')
		.attr('id', 'circle')
		.attr('cx', circle.state.cx)
		.attr('cy', circle.state.cy)
		.attr('r', circle.state.r)
		.style('z-index', 100)
		.attr('fill', 'none')
		.attr('stroke', 'black')
		.attr('stroke-width', '3px')
}

const radiusLabel = document.getElementById('radiusLabel')!;

const updateRadiusLabel = (radiusValue: number) => {
	const maxRadius = 450;
	const minRadius = 90 - 10;
	const portion = radiusValue / 100;


	const kms = minRadius + portion * (maxRadius - minRadius);
	radiusLabel.innerHTML = `Radius: ${kms.toFixed(2)}km`
}

radiusControllsElement.addEventListener('input', buffer(() => {
	const radiusValue = parseInt(radiusControllsElement.value)
	circle.update({ r: radiusValue });
	updateCircle();
	updateRadiusLabel(radiusValue)
	selectionController.update({ selection: selectionController.execute(circle.state) });
	updateSelection(selectionController.state);
}, 200));


let maxPopulation = 0;

const getFillColor = (id: string) => {
	if (!maxPopulation) {
		for (let stateData of Object.values(data)) {
			if (parseInt(stateData.population) > maxPopulation) {
				maxPopulation = stateData.population
			}
		}
		maxPopulation = Math.log(maxPopulation)
	}
	const maxHsl = 120;
	const minHsl = 0;
	const currentPopulation = maxPopulation - (Math.log(parseInt(data[id].population) ?? 1) / maxPopulation);

	const lerped = minHsl + (currentPopulation * maxHsl - minHsl);

	return `hsla(${lerped}, 100%, 50%, 1)`;
}

const screenToSVG = (screenX: number, screenY: number) => {
	//@ts-ignore
	var p = svgElement.createSVGPoint()
	p.x = screenX
	p.y = screenY
	//@ts-ignore
	return p.matrixTransform(svgElement.getScreenCTM().inverse());
}

function* toSliding2(array: any[]) {
	if (array.length <= 1) {
		throw "at least two entries"
	}
	for (let i = 0; i < array.length - 1; i++) {
		yield [array[i], array[i + 1]]
	}
}

const sum = (arr: number[]) => {
	let result = 0;
	for (let i = 0; i < arr.length; i++) {
		result += arr[i]
	}
	return result;
}

function init() {
	d3.json("./topo.json").then((us) => {
		// @ts-ignore
		features = topojson.feature(us, us.objects.counties).features.filter(d => data[d.id] && data[d.id].state !== 'Alaska' && data[d.id].state !== 'Hawaii')

		for (let feature of features) {
			let xs = [];
			let ys = []
			if (feature.geometry.type === 'MultiPolygon') {
				for (let coordinateSet of feature.geometry.coordinates) {
					for (let points of coordinateSet) {
						for (let point of points) {
							xs.push(parseFloat(point[0]))
							ys.push(parseFloat(point[1]))
						}
					}
				}
			} else {
				for (let points of feature.geometry.coordinates) {
					for (let point of points) {
						xs.push(parseFloat(point[0]))
						ys.push(parseFloat(point[1]))
					}
				}
			}
			avgs[feature.id] = [sum(xs) / xs.length, sum(ys) / ys.length]
		}

		svg.append("g").attr("class", "counties")
			.selectAll("path")
			.data(features)
			.enter()
			.append("path")
			.attr('id', (d) => `id_${d.id}`)
			.style("fill", (props) => getFillColor(props.id))
			.attr("d", path)
			.on("click", function (event, props) {
				svg.selectAll('[data-test="line"]').remove()
				selectedCountyId = props.id
				const { x: cx, y: cy } = screenToSVG(event.x, event.y)
				circle.update({ cx, cy });
				updateCircle();
				selectionController.update({ selection: selectionController.execute(circle.state) });
				updateSelection(selectionController.state);
				updateRoute([])
				for (let countyId of selectionController?.state.selection ?? []) {
					d3.select(`#id_${countyId}`).style("fill", getFillColor(countyId));
				}
			})
			.on("contextmenu", (event, props) => {
				event.preventDefault()
				const paths = routeController.execute(selectedCountyId, props.id)
				routeController.update({ from: selectedCountyId, to: props.id, paths })
				updateRoute(paths);
			});

		/// just as in docs
		const zoom = d3.zoom()
			.scaleExtent([1, 8])
			.translateExtent([[-100, -100], [1000 + 90, 800 + 100]])
			.filter(filter)
			.on("zoom", throttle(zoomed, 80));
		//@ts-ignore
		svg.call(zoom);
	})
}

Promise.all([dataJSON, adjecencyJSON]).then(([newData, newAdj]) => {
	data = newData;
	adjecency = newAdj;
	init();
})

function filter(event: any) {
	event.preventDefault();
	return (!event.ctrlKey || event.type === 'wheel') && !event.button;
}

function zoomed({ transform }: { transform: any }) {
	svg.attr("transform", transform);
}