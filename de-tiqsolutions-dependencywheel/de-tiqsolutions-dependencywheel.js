/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - (c) 2015 TIQ Solutions, Leipzig, Germany
Tested on Qlik Sense 2.1.1
*/
define(["jquery", "./chroma.min", "./d3.min", "css!./styles/de-tiqsolutions-dependencywheel.css"],
	function ($, chroma) {
		'use strict';
		return {
			initialProperties: {
				version: 1.0,
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 3,
						qHeight: 3333
					}]
				}
			},
			//property panel
			definition: {
				type: "items",
				component: "accordion",
				items: {
					dimensions: {
						uses: "dimensions",
						min: 2,
						max: 2
					},
					measures: {
						uses: "measures",
						min: 1,
						max: 1
					},
					sorting: {
						uses: "sorting"
					},
					addons: {
						uses: "addons",
						items: {
							dataHandling: {
								uses: "dataHandling"
							}
						}
					},
					settings: {
						uses: "settings",
						items: {

							options: {
								label: "Options",
								type: "items",
								items: {

									colorSchema: {
										ref: "colorSchema",
										type: "string",
										component: "dropdown",
										label: "Color Schema",
										options:
										[{
											value: "#fff7bb,#fca835,#ee7617,#cb4b02,#993404",
											label: "Sequencial"
										}, {
											value: "#993404,#cb4b02,#ee7617,#fca835,#fff7bb",
											label: "Sequencial (Reverse colors)"
										}, {
											value: "#3d53a2,#77b7e5,#e7f1f6,#f9bd7e,#d24d3e",
											label: "Diverging"
										}, {
											value: "#d24d3e,#f9bd7e,#e7f1f6,#77b7e5,#3d53a2",
											label: "Diverging (Reverse colors)"
										}],
										defaultValue: "#fff7bb,#fca835,#ee7617,#cb4b02,#993404"
									},

									aggregateDims: {
										type: "boolean",
										component: "switch",
										translation: "Aggregate Dimensions",
										ref: "aggregateDims",
										defaultValue: false,
										trueOption: {
											value: true,
											translation: "properties.on"
										},
										falseOption: {
											value: false,
											translation: "properties.off"
										}
									},

									labelSize: {
										ref: "labelSize",
										type: "integer",
										label: "Max. Label Size",
										defaultValue: 20
									}

								}
							}
						}
					}
				}
			},
			snapshot: {
				canTakeSnapshot: true
			},

			paint: function ($element, layout) {

				$element.html("");

				var qData = layout.qHyperCube.qDataPages[0];
				var id = "container_" + layout.qInfo.qId;
				var emtpyDim = "n/a";

				// custom properties
				var isAdjacencyList = layout.isAdjacencyList,
					colorSchema = layout.colorSchema.split(",");

				var dimensionLabels = layout.qHyperCube.qDimensionInfo.map(function (d) {
					return d.qFallbackTitle;
				});
				var qDimensionType = layout.qHyperCube.qDimensionInfo.map(function (d) {
					return d.qDimensionType;
				});
				var qDimSort = layout.qHyperCube.qDimensionInfo.map(function (d) {
					return d.qSortIndicator;
				});

				if (qData && qData.qMatrix) {
					//console.log(qData);
					var nodes = [],
						nodes2 = [],
						nodesObj = [],
						nodesObj2 = [],
						edges = [],
						edgesObj = [],
						dim1cnt = 0,
						node1Id = "",
						node2Id = "",
						edgeId = "",
						edgeIdRev = "",
						idx = -99,
						aggregateDims = layout.aggregateDims,
						labelSize = layout.labelSize;

					//loop through the rows of the cube and push the values into the array
					$.each(layout.qHyperCube.qDataPages[0].qMatrix, function (index, value) {
						if (!this[0].qIsEmpty && !this[1].qIsEmpty) {
							//Nodes of 1st dimension:
							if (this[0].qIsOtherCell) {
								this[0].qText = layout.qHyperCube.qDimensionInfo[0].othersLabel;
							}
							if (aggregateDims) {
								node1Id = this[0].qText;
							} else {
								node1Id = dimensionLabels[0] + ": " + this[0].qText;
							}
							idx = $.inArray(this[0].qText, nodes);
							if (idx == -1) {
								nodes.push(this[0].qText);
								nodesObj.push({ id: node1Id, label: this[0].qText, num: this[0].qNum, dim: 0, element: this[0].qElemNumber, dim0: this[0].qElemNumber, dim1: -1 });
							} else if (nodesObj[idx].dim0 == -1) {
								nodesObj[idx].dim0 = this[0].qElemNumber;
							}
							//Nodes of 2nd dimension:
							if (this[1].qIsOtherCell) {
								this[1].qText = layout.qHyperCube.qDimensionInfo[1].othersLabel;
							}
							if (this[1].qText == '-') {
								this[1].qText = emtpyDim;
							}
							if (aggregateDims) {
								node2Id = this[1].qText;
								idx = $.inArray(this[1].qText, nodes);
								if (idx == -1) {
									nodes.push(this[1].qText);
									nodesObj.push({ id: node2Id, label: this[1].qText, num: this[1].qNum, dim: 1, element: this[1].qElemNumber, dim0: -1, dim1: this[1].qElemNumber });
								} else if (nodesObj[idx].dim1 == -1) {
									nodesObj[idx].dim1 = this[1].qElemNumber;
								}
							} else {
								node2Id = dimensionLabels[1] + ": " + this[1].qText;
								idx = $.inArray(this[1].qText, nodes2);
								if (idx == -1) {
									nodes2.push(this[1].qText);
									nodesObj2.push({ id: node2Id, label: this[1].qText, num: this[1].qNum, dim: 1, element: this[1].qElemNumber, dim0: -1, dim1: this[1].qElemNumber });
								} else if (nodesObj2[idx].dim1 == -1) {
									nodesObj[idx].dim1 = this[1].qElemNumber;
								}
							}
							//Edges A->B and B->A
							edgeId = node1Id + "->" + node2Id;
							if ($.inArray(edgeId, edges) == -1) {
								edges.push(edgeId);
								edgesObj.push({ id: edgeId, source: node1Id, target: node2Id, weight: this[2].qNum });
							}
							if (!aggregateDims) {
								edgeIdRev = node2Id + "->" + node1Id;
								if ($.inArray(edgeIdRev, edges) == -1) {
									//add the opposite direction for the matrix (not for real graphs..)
									edges.push(edgeIdRev);
									edgesObj.push({ id: edgeIdRev, source: node2Id, target: node1Id, weight: this[2].qNum });
								}
							}
						}
					});

					if (aggregateDims) {
						dim1cnt = 1;
						nodes.sort(function (a, b) {
							var x = a.toLowerCase(), y = b.toLowerCase();
							return x < y ? -1 : x > y ? 1 : 0;
						});
						nodesObj.sort(function (a, b) {
							var x = a.id.toLowerCase(), y = b.id.toLowerCase();
							return x < y ? -1 : x > y ? 1 : 0;
						});
					} else {
						dim1cnt = nodes.length;
						// Sorting Dim2
						if (qDimensionType[1] == "N") {
							// Numeric
							if (qDimSort[1] == "A") {
								nodesObj2.sort(function (o1, o2) { return o1.num - o2.num; });
							} else {
								nodesObj2.sort(function (o1, o2) { return o2.num - o1.num; });
							}
						} else {
							// Alphabetic
							if (qDimSort[1] == "A") {
								nodesObj2.sort(function (a, b) {
									var x = a.id.toLowerCase(), y = b.id.toLowerCase();
									return x < y ? -1 : x > y ? 1 : 0;
								});
							} else {
								nodesObj2.sort(function (a, b) {
									var y = a.id.toLowerCase(), x = b.id.toLowerCase();
									return x < y ? -1 : x > y ? 1 : 0;
								});
							}
						}
						nodes2 = nodesObj2.map(function (d) {
							return d.label;
						});

						nodes = nodes.concat(nodes2);
						nodesObj = nodesObj.concat(nodesObj2);

						//not needed anymore
						nodes2 = [];
						nodesObj2 = [];
					}

					var colors = chroma.interpolate.bezier(colorSchema),
						colorPalette = [1, 1],
						colorPaletteSize = nodes.length,
						colorPaletteStep = (colorPaletteSize == 1 ? 1 : 1 / (colorPaletteSize - 1));
					for (var i = 0; i < colorPaletteSize; i++) {
						colorPalette[i] = colors(i * colorPaletteStep);
					}

					var data = {
						self: this,
						packageNames: nodes,
						nodes: nodesObj,
						sum: d3.sum(layout.qHyperCube.qDataPages[0].qMatrix, function (d) { return d[2].qNum; }),
						dim1cnt: dim1cnt,
						aggregateDims: aggregateDims,
						matrix: createMatrix(nodesObj, edges, edgesObj, aggregateDims),
						colorPalette: colorPalette
					};

					var elementWidth = Math.min($element.width(), $element.height());
					var chartWidth = Math.floor(elementWidth * 0.76);

					// Check to see if the chart element has already been created
					if (document.getElementById(id)) {
						// if it has been created, empty it's contents so we can redraw it
						$("#" + id).empty();
					} else {
						// if it hasn't been created, create it with the appropriate id and size
						$element.append($('<div />').attr("id", id).width($element.width()).height($element.height()));
					}
					// keep mouse cursor arrow instead of text select (auto)
					$("#" + id).css('cursor', 'default');

					var options = {
						elementId: id,
						width: chartWidth,
						margin: chartWidth * .15,
						padding: 0.02,
						maxStrLength: labelSize
					};

					var chart = dependencyWheel(options);
					d3.select('#' + id)
						.datum(data)
						.call(chart);

					var svg = $('#' + id + ' svg');
					var bb = svg[0].getBBox();
					svg[0].setAttribute('viewBox', [bb.x, bb.y, bb.width, bb.height].join(','));
				}
			}
		};
	});

function createMatrix(nodes, edges, edgesObj, aggregateDims) {
	var id = "", pos = 0, matrix = [];
	for (a in nodes) {
		var grid = [];
		for (b in nodes) {
			if (a === b && !aggregateDims) {
				grid.push(0);
			} else {
				id = nodes[a].id + "->" + nodes[b].id;
				pos = $.inArray(id, edges);
				if (!(pos == -1)) {
					grid.push(edgesObj[pos].weight);
				} else {
					grid.push(0);
				}
			}
		}
		matrix.push(grid);
	}
	return matrix;
}

var tooltipDisplay = function (that, tooltipSelector, tooltipSelectorHeader, tooltipSelectorContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, divider) {
	d3.select(tooltipSelectorHeader)
		.html(ttHeader);
	d3.select(tooltipSelectorContent)
		.html(ttContent);

	var tt = d3.select(tooltipSelector);
	var bbRect = that.getBoundingClientRect();

	var xPosition = Math.max(10, (window.pageXOffset + bbRect.left)
		- tt[0][0].clientWidth / divider + bbRect.width / 2)
		;
	var yPosition = Math.max(10, (window.pageYOffset + bbRect.top)
		- tt[0][0].clientHeight / divider + bbRect.height / 2)
		;
	tt.style("left", xPosition + "px")
		.style("top", yPosition + "px")
		.transition()
		.delay(tooltipDelay)
		.style("opacity", tooltipOpacity)
		;
}

/**
 * Based on;
 * Dependency wheel chart for d3.js
 * @author François Zaninotto
 * @license MIT
 * @see https://github.com/fzaninotto/DependencyWheel for complete source and license
 */
var dependencyWheel = function (options) {
	if (options) {
		var width = options.width;
		var margin = options.margin;
		var padding = options.padding;
		var maxStrLength = options.maxStrLength;
	} else {
		var width = 800;
		var margin = 150;
		var padding = 0.02;
		var maxStrLength = 20;
	}

	function chart(selection) {
		var id = this[0][0].id;

		selection.each(function (data) {

			//var formatX = d3.format("0,.2f");

			var self = data.self,
				matrix = data.matrix,
				packageNames = data.packageNames,
				nodes = data.nodes,
				sum = data.sum,
				dim1cnt = Math.max(1, data.dim1cnt),
				aggregateDims = data.aggregateDims,
				colorPalette = data.colorPalette,
				radius = width / 2 - margin;

			// create the layout
			var chord = d3.layout.chord()
				.padding(padding)
				.sortSubgroups(d3.descending);

			var tooltip = d3.select(this).append("div")
				.attr("class", "irregular-tooltip")
				.style("opacity", "0")
				;
			tooltip.append("p")
				.attr("class", "irregular-tooltip-header")
				;
			tooltip.append("p")
				.attr("class", "irregular-tooltip-content")
				;

			var tooltipSelector = "#" + id + " .irregular-tooltip",
				tooltipSelectorHeader = "#" + id + " .irregular-tooltip-header",
				tooltipSelectorContent = "#" + id + " .irregular-tooltip-content",
				tooltipDelay = 750,
				tooltipOpacity = "0.9";

			// Select the svg element, if it exists.
			//var svg = d3.select(this).selectAll("svg").data([data]);
			var svg = d3.select(this).append("svg:svg")
				.attr("width", "100%")
				.attr("height", "100%")
				.attr("preserveAspectRatio", "xMidYMid")
				.attr("class", "dependencyWheel")
				;

			svg.data([data]);

			// create the skeletal chart.
			var gEnter = svg
				.append("g");
			//.attr("transform", "translate(" + ((width / 2) + (width * .2)) + "," + ((width / 2) + (width * .2)) + ")");

			var arc = d3.svg.arc()
				.innerRadius(radius)
				.outerRadius(radius + 20);

			var fill = function (d) {
				//if (d.index === 0) return '#ccc';
				//return "hsl(" + parseInt(((packageNames[d.index][0].charCodeAt() - 97) / 26) * 360, 10) + ",90%,70%)";
				return colorPalette[d.index];
			};

			// Returns an event handler for fading a given chord group.
			var fade = function (opacity) {
				return function (g, i) {
					svg.selectAll(".chord")
						.filter(function (d) {
							return d.source.index != i && d.target.index != i;
						})
						.transition()
						.style("opacity", opacity);
					var groups = [];
					svg.selectAll(".chord")
						.filter(function (d) {
							if (d.source.index == i) {
								groups.push(d.target.index);
							}
							if (d.target.index == i) {
								groups.push(d.source.index);
							}
						});
					groups.push(i);
					var length = groups.length;
					svg.selectAll('.group')
						.filter(function (d) {
							for (var i = 0; i < length; i++) {
								if (groups[i] == d.index) return false;
							}
							return true;
						})
						.transition()
						.style("opacity", opacity);
				};
			};

			// Returns an event handler for fading all other chords.
			var fadeOther = function (opacity) {
				return function (g, i) {
					var iSource = g.source.index,
						iTarget = g.target.index;
					svg.selectAll(".chord")
						.filter(function (d) {
							//console.log(d);
							return !(d.source.index === iSource && d.target.index === iTarget);
						})
						.transition()
						.style("opacity", opacity);
					var groups = [];
					svg.selectAll(".chord")
						.filter(function (d) {
							if (d.source.index === iSource && d.target.index == iTarget) {
								groups.push(d.target.index);
								groups.push(d.source.index);
							}
						});
					//          groups.push(i);
					var length = groups.length;
					svg.selectAll('.group')
						.filter(function (d) {
							for (var i = 0; i < length; i++) {
								if (groups[i] == d.index) return false;
							}
							return true;
						})
						.transition()
						.style("opacity", opacity);
				};
			};

			chord.matrix(matrix);
			if (aggregateDims) {
				rotation = 0;
			} else {
				var rotation = 90 - (chord.groups()[dim1cnt - 1].endAngle - chord.groups()[0].startAngle) / 2 * (180 / Math.PI);
			}

			var g = gEnter.selectAll("g.group")
				.data(chord.groups)
				.enter().append("svg:g")
				.attr("class", "group")
				.attr("transform", function (d) {
					return "rotate(" + rotation + ")";
				})
				.on("click", function (d, i) {
					if (aggregateDims) {
						self.backendApi.selectValues(0, [nodes[i].dim0], false);
						self.backendApi.selectValues(1, [nodes[i].dim1], false);
					} else {
						self.backendApi.selectValues(nodes[i].dim, [nodes[i].element], true);
					}
				})
				;
			// g.append("title").text(function (d, i, g) {
			// 	return "Total " + nodes[i].id + "\n" + formatX(d.value) + " (" + formatX(d.value / sum * 100) + "%)";
			// });

			var gValuesArr = g[0].map(function (d, i) {
				return [nodes[i].id, d.__data__.value];
			});
			var gValuesObj = {};
			$.each(gValuesArr, function (index, value) {
				gValuesObj[value[0]] = value[1];
			});

			g.append("svg:path")
				.style("fill", fill)
				.style("stroke", fill)
				.attr("d", arc)
				.on("mouseover", fade(0.15))
				.on("mouseout", fade(1))
				.on("mouseenter", function (d, i, g) {
					d3.select(this)
						.style("opacity", "0.6")
						.attr("stroke", "#C4C4C4")
						;

					var ttHeader = nodes[i].id,
						ttContent = "Total: " + d.value.toLocaleString() + " (" + (d.value / sum * 100).toLocaleString() + "%)";
					tooltipDisplay(this, tooltipSelector, tooltipSelectorHeader, tooltipSelectorContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, 1);
				})
				.on("mouseleave", function (d) {
					d3.select(this)
						.style("opacity", "1")
						.attr("stroke", fill)
						;
					d3.select(tooltipSelector)
						.style("opacity", "0")
						.transition()
						.remove
						;
				})
				;

			g.append("svg:text")
				.each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
				.attr("dy", ".35em")
				.attr("text-anchor", function (d) { return d.angle > Math.PI ? "end" : null; })
				.attr("class", "mono")
				.attr("transform", function (d) {
					return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
						"translate(" + (radius + 26) + ")" +
						(d.angle > Math.PI ? "rotate(180)" : "");
				})
				.text(function (d) {
					return (packageNames[d.index].length > maxStrLength) ? packageNames[d.index].substring(0, maxStrLength - 2) + '..' : packageNames[d.index];
				});

			gEnter.selectAll("path.chord")
				.data(chord.chords)
				.enter().append("svg:path")
				.attr("class", "chord")
				.style("stroke", function (d) { return d3.rgb(fill(d.source)).darker(); })
				.style("fill", function (d) { return fill(d.source); })
				.attr("d", d3.svg.chord().radius(radius))
				.attr("transform", function (d) {
					return "rotate(" + rotation + ")";
				})
				.style("opacity", 1)
				.on("click", function (d, i) {
					if (aggregateDims) {
						self.backendApi.selectValues(0, [nodes[d.source.index].dim0, nodes[d.target.index].dim0], false);
						self.backendApi.selectValues(1, [nodes[d.source.index].dim1, nodes[d.target.index].dim1], false);
					} else {
						self.backendApi.selectValues(0, [nodes[d.source.index].element], false);
						self.backendApi.selectValues(1, [nodes[d.target.index].element], false);
					}
				})
				.on("mouseover", fadeOther(0.15))
				.on("mouseout", fadeOther(1))
				.on("mouseenter", function (d, i, g) {
					var ttHeader = "Dependency",
						ttContent = "Content";

					if (aggregateDims) {
						if (nodes[d.source.index].id == nodes[d.target.index].id) {
							ttContent = (nodes[d.source.index].id + " ↔ " + nodes[d.target.index].id + ": " + d.source.value.toLocaleString() + " (" + (d.source.value / gValuesObj[nodes[d.source.index].id] * 100).toLocaleString() + "%)");
						} else {
							ttContent =
								nodes[d.source.index].id + " → " + nodes[d.target.index].id + ": " + d.source.value.toLocaleString() + " (" + (d.source.value / gValuesObj[nodes[d.source.index].id] * 100).toLocaleString() + "%)<br/>" +
								nodes[d.target.index].id + " → " + nodes[d.source.index].id + ": " + d.target.value.toLocaleString() + " (" + (d.target.value / gValuesObj[nodes[d.target.index].id] * 100).toLocaleString() + "%)"
								;
						}
					} else {
						ttContent = nodes[d.source.index].id + " → " + nodes[d.target.index].id + "<br/>" + d.source.value.toLocaleString() +
							" (" + (d.source.value / gValuesObj[nodes[d.source.index].id] * 100).toLocaleString() + "% → " +
							(d.source.value / gValuesObj[nodes[d.target.index].id] * 100).toLocaleString() + "%)";
					}
					tooltipDisplay(this, tooltipSelector, tooltipSelectorHeader, tooltipSelectorContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, 2);
				})
				.on("mouseleave", function (d) {
					d3.select(tooltipSelector)
						.style("opacity", "0")
						.transition()
						.remove
						;
				})


			// Add an elaborate mouseover title for each chord.
			// .append("title").text(function (d) {
			// 	if (aggregateDims) {
			// 		if (nodes[d.source.index].id == nodes[d.target.index].id) {
			// 			return (nodes[d.source.index].id + " ↔ " + nodes[d.target.index].id + ": " + formatX(d.source.value) + " (" + formatX(d.source.value / gValuesObj[nodes[d.source.index].id] * 100) + "%)");
			// 		} else {
			// 			return (
			// 				nodes[d.source.index].id + " → " + nodes[d.target.index].id + ": " + formatX(d.source.value) + " (" + formatX(d.source.value / gValuesObj[nodes[d.source.index].id] * 100) + "%)\n" +
			// 				nodes[d.target.index].id + " → " + nodes[d.source.index].id + ": " + formatX(d.target.value) + " (" + formatX(d.target.value / gValuesObj[nodes[d.target.index].id] * 100) + "%)"
			// 			);
			// 		}
			// 	} else {
			// 		return (nodes[d.source.index].id + " → " + nodes[d.target.index].id + "\n" + formatX(d.source.value) +
			// 			" (" + formatX(d.source.value / gValuesObj[nodes[d.source.index].id] * 100) + "% → " +
			// 			formatX(d.source.value / gValuesObj[nodes[d.target.index].id] * 100) + "%)");
			// 	}
			// });

		});

	}

	chart.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return chart;
	};

	chart.margin = function (value) {
		if (!arguments.length) return margin;
		margin = value;
		return chart;
	};

	chart.padding = function (value) {
		if (!arguments.length) return padding;
		padding = value;
		return chart;
	};

	return chart;
};