/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - (c) 2015 TIQ Solutions, Leipzig, Germany
Tested on Qlik Sense 2.1.1
*/
define(["jquery", "qlik", "underscore", "./chroma.min", "./d3.min", "css!./styles/de-tiqsolutions-dependencywheel.css"],
    function ($, qlik, _, chroma) {
        'use strict';

        return {
            initialProperties: {
                version: 1.0,
                qHyperCubeDef: {
                    qDimensions: [],
                    qMeasures: [],
                    qInitialDataFetch: [{
                        qWidth: 4,
                        qHeight: 1000 // needs a limitation
					}]
                },
                selectionMode: "CONFIRM"
            },
            //property panel
            definition: {
                type: "items",
                component: "accordion",
                items: {
                    dimensions: {
                        uses: "dimensions",
                        min: 2,
                        max: 3
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
                                        options: [{
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

            support: {
                snapshot: true,
                export: true,
                exportData: true
            },

            template: '<div style="cursor:default;" class="dependencywheel"></div>',

            controller: ["$scope", "$element", function (scope, element) {

                var render = function(element, layout) {
                    var qData = layout.qHyperCube.qDataPages[0];
                    var aggregateDims = layout.aggregateDims,
                        labelSize = layout.labelSize,
                        edgeDim = layout.qHyperCube.qDimensionInfo.length > 2,
                        measureField = layout.qHyperCube.qDimensionInfo.length;

                    element.empty();

                    // custom properties
                    var colorSchema = layout.colorSchema.split(",");

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
                            idx = -99;

                        //loop through the rows of the cube and push the values into the array
                        $.each(layout.qHyperCube.qDataPages[0].qMatrix, function (index, value) {
                            if (!this[0].hasOwnProperty("qText")) {
                                if (this[0].hasOwnProperty("qNum") && this[0].qNum != "NaN") {
                                    this[0].qText = this[0].qNum.toString();
                                } else {
                                    this[0].qText = "undefined";
                                }
                            }
                            if (!this[1].hasOwnProperty("qText")) {
                                if (this[1].hasOwnProperty("qNum")) {
                                    this[1].qText = "" + this[1].qNum;
                                } else {
                                    this[1].qText = "undefined";
                                }
                            }

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
                                nodesObj.push({
                                    id: node1Id,
                                    label: this[0].qText,
                                    num: this[0].qNum,
                                    dim: 0,
                                    element: this[0].qElemNumber,
                                    dim0: this[0].qElemNumber,
                                    dim1: -1
                                });
                            } else if (nodesObj[idx].dim0 == -1) {
                                nodesObj[idx].dim0 = this[0].qElemNumber;
                            }
                            //Nodes of 2nd dimension:
                            if (this[1].qIsOtherCell) {
                                this[1].qText = layout.qHyperCube.qDimensionInfo[1].othersLabel;
                            }
                            if (aggregateDims) {
                                node2Id = this[1].qText;
                                idx = $.inArray(this[1].qText, nodes);
                                if (idx == -1) {
                                    nodes.push(this[1].qText);
                                    nodesObj.push({
                                        id: node2Id,
                                        label: this[1].qText,
                                        num: this[1].qNum,
                                        dim: 1,
                                        element: this[1].qElemNumber,
                                        dim0: -1,
                                        dim1: this[1].qElemNumber
                                    });
                                } else if (nodesObj[idx].dim1 == -1) {
                                    nodesObj[idx].dim1 = this[1].qElemNumber;
                                }
                            } else {
                                node2Id = dimensionLabels[1] + ": " + this[1].qText;
                                idx = $.inArray(this[1].qText, nodes2);
                                if (idx == -1) {
                                    nodes2.push(this[1].qText);
                                    nodesObj2.push({
                                        id: node2Id,
                                        label: this[1].qText,
                                        num: this[1].qNum,
                                        dim: 1,
                                        element: this[1].qElemNumber,
                                        dim0: -1,
                                        dim1: this[1].qElemNumber
                                    });
                                } else if (nodesObj2[idx].dim1 == -1) {
                                    nodesObj[idx].dim1 = this[1].qElemNumber;
                                }
                            }
                            //Edges A->B and B->A
                            edgeId = node1Id + "->" + node2Id;
                            if ($.inArray(edgeId, edges) == -1) {
                                edges.push(edgeId);
                                edgesObj.push({
                                    id: edgeId,
                                    source: node1Id,
                                    target: node2Id,
                                    weight: this[measureField].qNum,
                                    sourceElement: this[0].qElemNumber,
                                    targetElement: this[1].qElemNumber,
                                    edgeElement: edgeDim ? this[2].qElemNumber : -1
                                });
                            }
                            if (!aggregateDims) {
                                //add the opposite direction for the matrix (not for real graphs..)
                                edgeIdRev = node2Id + "->" + node1Id;
                                if ($.inArray(edgeIdRev, edges) == -1) {
                                    edges.push(edgeIdRev);
                                    edgesObj.push({
                                        id: edgeIdRev,
                                        source: node2Id,
                                        target: node1Id,
                                        weight: this[measureField].qNum,
                                        sourceElement: -1,
                                        targetElement: -1,
                                        edgeElement: -1
                                    });
                                }
                            }
                        });

                        if (aggregateDims) {
                            dim1cnt = 1;
                            nodes.sort(function (a, b) {
                                var x = a.toLowerCase(),
                                    y = b.toLowerCase();
                                return x < y ? -1 : x > y ? 1 : 0;
                            });
                            nodesObj.sort(function (a, b) {
                                var x = a.id.toLowerCase(),
                                    y = b.id.toLowerCase();
                                return x < y ? -1 : x > y ? 1 : 0;
                            });
                        } else {
                            dim1cnt = nodes.length;
                            // Sorting Dim2
                            if (qDimensionType[1] == "N") {
                                // Numeric
                                if (qDimSort[1] == "A") {
                                    nodesObj2.sort(function (o1, o2) {
                                        return o1.num - o2.num;
                                    });
                                } else {
                                    nodesObj2.sort(function (o1, o2) {
                                        return o2.num - o1.num;
                                    });
                                }
                            } else {
                                // Alphabetic
                                if (qDimSort[1] == "A") {
                                    nodesObj2.sort(function (a, b) {
                                        var x = a.id.toLowerCase(),
                                            y = b.id.toLowerCase();
                                        return x < y ? -1 : x > y ? 1 : 0;
                                    });
                                } else {
                                    nodesObj2.sort(function (a, b) {
                                        var y = a.id.toLowerCase(),
                                            x = b.id.toLowerCase();
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

                        var matrix = createMatrix(nodesObj, edges, edgesObj, aggregateDims);
                        var matrixAggr = aggregateDims ? aggrMatrix(matrix) : 0;
                        
                        var data = {
                            scope: scope,
                            self: this,
                            packageNames: nodes,
                            nodes: nodesObj,
                            edges: edgesObj,
                            sum: d3.sum(layout.qHyperCube.qDataPages[0].qMatrix, function (d) {
                                return d[measureField].qNum;
                            }),
                            dim1cnt: dim1cnt,
                            aggregateDims: aggregateDims,
                            edgeDim: edgeDim,
                            matrix: matrix,
                            matrixAggr: matrixAggr,
                            colorPalette: colorPalette
                        };

                        var elementWidth = Math.min(element.width(), element.height());
                        var chartWidth = Math.floor(elementWidth * 0.76);

                        var options = {
                            element: element,
                            width: chartWidth,
                            margin: chartWidth * .15,
                            padding: 0.02,
                            maxStrLength: labelSize
                        };

                        var chart = dependencyWheel(options, !(qlik.navigation.getMode() === "analysis"));
                        var d = d3.select(element)
                            .datum(data)
                            .call(chart);
                        
                        var svg = $(element).find('svg');
                        var bb = svg.get(0).getBBox();
                        svg.attr('viewBox', [bb.x, bb.y, bb.width, bb.height].join(','));
                    }

                };

                scope.renderMeLater = _.debounce(render, 250);

                scope.getSizing = function () {
                    return {
                        height: element.height(),
                        width: element.width()
                    };
                };

                render(element, scope.layout);
                
                scope.component.model.Validated.bind(function () {
                    if (!scope.layout.qSelectionInfo.qInSelections) {
                        render(element, scope.layout);
                    }
                });
                             
                scope.$watch(scope.getSizing, function (newValue, oldValue) {
                    // subtitle frame and selection frame reduces size
                    if (Math.abs(oldValue.height - newValue.height) > 23 || Math.abs(oldValue.width - newValue.width) > 34) {
                        scope.renderMeLater(element, scope.layout);
                    }
                }, true);

                scope.$on('$destroy', function() {
                    scope.component.model.Validated.unbind();
                });
            }]
        };
    });

function createMatrix(nodes, edges, edgesObj, aggregateDims) {
    var id = "",
        pos = 0,
        matrix = [];
    for (a in nodes) {
        var grid = [];
        for (b in nodes) {
            var val = 0;
            if (a === b && !aggregateDims) {
            } else {
                id = nodes[a].id + "->" + nodes[b].id;
                pos = $.inArray(id, edges);
                if (!(pos === -1)) {
                    val = edgesObj[pos].weight;
                }
            }
            grid.push(val);
        }
        matrix.push(grid);
    }
    return matrix;
}

function aggrMatrix(matrix) {
    var aggr = [];
    for (var i = 0; i < matrix.length; i++) {
        //from,to,total
        aggr.push([d3.sum(matrix[i]), 0]);
    }
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            if (!(i === j)) {
                aggr[i][1] += matrix[j][i];
            }
        }
    }
    return aggr;
}

var tooltipDisplay = function (that, tooltip, tooltipHeader, tooltipContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, divider) {
    tooltipHeader
        .html(ttHeader);
    tooltipContent
        .html(ttContent);

    var bbRect = that.getBoundingClientRect();

    var e = $(tooltip).get(0)[0];
    var clientWidth = e.clientWidth, clientHeight = e.clientHeight;
    
    var xPosition = Math.max(10, (window.pageXOffset + bbRect.left) - clientWidth / divider + bbRect.width / 2);
    var yPosition = Math.max(10, (window.pageYOffset + bbRect.top) - clientHeight / divider + bbRect.height / 2);
    
    tooltip.style("left", xPosition + "px")
        .style("top", yPosition + "px")
        .transition()
        .delay(tooltipDelay)
        .style("opacity", tooltipOpacity);
}

/**
 * Based on;
 * Dependency wheel chart for d3.js
 * @author François Zaninotto
 * @license MIT
 * @see https://github.com/fzaninotto/DependencyWheel for complete source and license
 */
var dependencyWheel = function (options, isEditMode) {
    var element = options.element;
    var width = options.width;
    var margin = options.margin;
    var padding = options.padding;
    var maxStrLength = options.maxStrLength;

    function chart(selection) {
        var selectionColor = '#52CC52';

        selection.each(function (data) {
            var scope = data.scope,
                self = data.self,
                matrix = data.matrix,
                matrixAggr = data.matrixAggr,
                packageNames = data.packageNames,
                nodes = data.nodes,
                edges = data.edges,
                sum = data.sum,
                dim1cnt = Math.max(1, data.dim1cnt),
                aggregateDims = data.aggregateDims,
                edgeDim = data.edgeDim,
                colorPalette = data.colorPalette,
                radius = width / 2 - margin;

            // create the layout
            var chord = d3.layout.chord()
                .padding(padding)
                .sortSubgroups(d3.descending);

            var tooltip = d3.selectAll(element).append("div")
                .attr("class", "irregular-tooltip")
                .style("opacity", "0");
            var tooltipHeader = tooltip.append("p")
                .attr("class", "irregular-tooltip-header");
            var tooltipContent = tooltip.append("p")
                .attr("class", "irregular-tooltip-content");

            var tooltipDelay = 750,
                tooltipOpacity = "0.9";

            // Select the svg element, if it exists.
            var svg = d3.selectAll(element).append("svg")
                .attr("width", width)
                .attr("height", width)
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("class", "dependencyWheel");

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
                .enter().append("g")
                .attr("class", "group")
                .attr("transform", function (d) {
                    return "rotate(" + rotation + ")";
                })
                .on("click", function (d, i) {
                    if (!isEditMode) {
                        var paths = d3.select(this).select("path");
                        var selected = false;
                        //console.log("paths clicked",paths);
                        if (aggregateDims) {
                            if (edgeDim) {
                                var edgesToSelect = edges.filter(function (e) {
                                    return ((nodes[i].dim0 > -1 && e.sourceElement == nodes[i].dim0) 
                                        || (nodes[i].dim1 > -1 && e.targetElement == nodes[i].dim1));
                                }).map(function (e) {
                                    return e.edgeElement;
                                });
                                if (edgesToSelect.length > 0) {
                                    scope.selectValues(2, edgesToSelect, true);
                                    selected = true;
                                }
                            } else {
                                if (nodes[i].dim === 0) {
                                    if (nodes[i].dim0 > -1) {
                                        scope.selectValues(0, [nodes[i].dim0], true);
                                        selected = true;
                                    }
                                } else {
                                    if (nodes[i].dim1 > -1) {
                                        scope.selectValues(1, [nodes[i].dim1], true);
                                        selected = true;
                                    }
                                }
                            }
                        } else {
                            if (nodes[i].element > -1) {
                                scope.selectValues(nodes[i].dim, [nodes[i].element], true);
                                selected = true;
                            }
                        }
                        if (selected && paths[0].length > 0) {
                            if (paths[0][0].hasOwnProperty('colorBackup')) {
                                paths[0][0].style.fill = paths[0][0].colorBackup;
                                delete paths[0][0].colorBackup;
                            } else {                      
                                paths[0][0].colorBackup = paths[0][0].style.fill;
                                paths[0][0].style.fill = selectionColor;
                            }
                        }
                    }
                });

            var gValuesArr = g[0].map(function (d, i) {
                return [nodes[i].id, d.__data__.value];
            });
            var gValuesObj = {};
            $.each(gValuesArr, function (index, value) {
                gValuesObj[value[0]] = value[1];
            });

            g.append("path")
                .style("fill", fill)
                .style("stroke", fill)
                .attr("d", arc)
                .on("mouseover", fade(0.15))
                .on("mouseout", fade(1))
                .on("mouseenter", function (d, i, g) {
                    d3.select(this)
                        .style("opacity", "0.6")
                        .attr("stroke", "#C4C4C4");

                    var ttHeader = "",
                        ttContent = "";
                    if (aggregateDims) {
                        ttHeader = nodes[i].id + " → : " + matrixAggr[i][0].toLocaleString() + " (" + (matrixAggr[i][0] / sum * 100).toLocaleString() + "%)";
                        ttContent = nodes[i].id + " ← : " + matrixAggr[i][1].toLocaleString() + " (" + (matrixAggr[i][1] / sum * 100).toLocaleString() + "%)<br/>" +
                            nodes[i].id + " Σ &nbsp;&nbsp;: " + (matrixAggr[i][0] + matrixAggr[i][1]).toLocaleString() + " (" + ((matrixAggr[i][0] + matrixAggr[i][1]) / sum * 100).toLocaleString() + "%)";
                    } else {
                        ttHeader = nodes[i].id;
                        ttContent = "Total: " + d.value.toLocaleString() + " (" + (d.value / sum * 100).toLocaleString() + "%)";
                    } 
                    tooltipDisplay(this, tooltip, tooltipHeader, tooltipContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, 1);
                })
                .on("mouseleave", function (d) {
                    d3.select(this)
                        .style("opacity", "1")
                        .attr("stroke", fill);
                    tooltip
                        .style("opacity", "0")
                        .transition()
                        .remove;
                });

            g.append("text")
                .each(function (d) {
                    d.angle = (d.startAngle + d.endAngle) / 2;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", function (d) {
                    return d.angle > Math.PI ? "end" : null;
                })
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
                .style("stroke", function (d) {
                    return d3.rgb(fill(d.source)).darker();
                })
                .style("fill", function (d) {
                    return fill(d.source);
                })
                .attr("d", d3.svg.chord().radius(radius))
                .attr("transform", function (d) {
                    return "rotate(" + rotation + ")";
                })
                .style("opacity", 1)
                .on("click", function (d, i) {
                    if (!isEditMode) {
                        var selected = false;
                        if (edgeDim) {
                            var sourceElement = nodes[d.source.index].element,
                                targetElement = nodes[d.target.index].element;
                            var edgeToSelect1 = $.grep(edges, function (e) {
                                return ((sourceElement > -1 && e.sourceElement == sourceElement 
                                    && targetElement > -1 && e.targetElement == targetElement));
                            });
                            if (edgeToSelect1.length > 0) {
                                scope.selectValues(2, [edgeToSelect1[0].edgeElement], true);
                                selected = true;
                            }
                            if (aggregateDims && sourceElement != targetElement) {
                                var edgeToSelect2 = $.grep(edges, function (e) {
                                    return (targetElement > -1 && e.sourceElement == targetElement
                                        && sourceElement > -1 && e.targetElement == sourceElement);
                                });
                                if (edgeToSelect2.length > 0) {
                                    setTimeout(function () {
                                        scope.selectValues(2, [edgeToSelect2[0].edgeElement], true);
                                    }, 100);
                                    selected = true;
                                }
                            }
                        } else {
                            if (aggregateDims) {
                                var edgeToSelect3 = $.grep([nodes[d.source.index].dim0, nodes[d.target.index].dim0], function (e) { return e > -1 });
                                if (edgeToSelect3.length > 0) {
                                    scope.selectValues(0, edgeToSelect3, true);
                                    selected = true;
                                }
                                var edgeToSelect4 = $.grep([nodes[d.source.index].dim1, nodes[d.target.index].dim1], function (e) { return e > -1 });
                                if (edgeToSelect4.length > 0) {
                                    setTimeout(function () {
                                        scope.selectValues(1, [nodes[d.source.index].dim1, nodes[d.target.index].dim1], true)
                                    }, 100);
                                    selected = true;
                                }
                            } else {
                                if (nodes[d.source.index].element > -1) {
                                    scope.selectValues(0, [nodes[d.source.index].element], true);
                                    selected = true;
                                } 
                                if (nodes[d.target.index].element > -1) {
                                    setTimeout(function () {
                                        scope.selectValues(1, [nodes[d.target.index].element], true)
                                    }, 100);
                                    selected = true;
                                }
                            }
                        }
                        if (selected) {
                            if (this.style.hasOwnProperty('colorBackup')) {
                                this.style.fill = this.style.colorBackup;
                                delete this.style.colorBackup;
                            } else {
                                this.style.colorBackup = this.style.fill;
                                this.style.fill = selectionColor;
                            }
                        }
                    }
                })
                .on("mouseover", fadeOther(0.15))
                .on("mouseout", fadeOther(1))
                .on("mouseenter", function (d, i, g) {
                    var ttHeader = "",
                        ttContent = "",
                        spacer = "&#8226;&nbsp;&nbsp"

                    if (aggregateDims) {
                        if (nodes[d.source.index].id == nodes[d.target.index].id) {
                            ttContent = nodes[d.source.index].id + " ↔ " + nodes[d.target.index].id + ": " + d.source.value.toLocaleString() + "<br/>" +
                                        spacer + (d.source.value / (matrixAggr[d.source.index][0] + matrixAggr[d.source.index][1]) * 100).toLocaleString() + "% of " + nodes[d.source.index].id + "<br/>" +
                                        spacer + (d.source.value / sum * 100).toLocaleString() + "% of Total";
                        } else {
                            ttContent =
                                nodes[d.source.index].id + " → " + nodes[d.target.index].id + ": " + d.source.value.toLocaleString() + "<br/>" +
                                spacer + (d.source.value / gValuesObj[nodes[d.source.index].id] * 100).toLocaleString() + "% of " + nodes[d.source.index].id + "<br/>" +
                                spacer + (d.source.value / sum * 100).toLocaleString() + "% of Total<br/><br/>" +
                                nodes[d.target.index].id + " → " + nodes[d.source.index].id + ": " + d.target.value.toLocaleString() + "<br/>" +
                                spacer + (d.target.value / gValuesObj[nodes[d.target.index].id] * 100).toLocaleString() + "% of " + nodes[d.target.index].id + "<br/>" +
                                spacer + (d.target.value / sum * 100).toLocaleString() + "% of Total";
                        }
                    } else {
                        ttContent = nodes[d.source.index].id + " → " + nodes[d.target.index].id + ": " + d.source.value.toLocaleString() + "<br/>" +
                            spacer + (d.source.value / gValuesObj[nodes[d.source.index].id] * 100).toLocaleString() + "% of " + nodes[d.source.index].id + "<br/>" +
                            spacer + (d.source.value / gValuesObj[nodes[d.target.index].id] * 100).toLocaleString() + "% of " + nodes[d.target.index].id + "<br/>" +
                            spacer + (d.source.value / sum * 100).toLocaleString() + "% of Total";
                    }
                    tooltipDisplay(this, tooltip, tooltipHeader, tooltipContent, ttHeader, ttContent, tooltipDelay, tooltipOpacity, 2);
                })
                .on("mouseleave", function (d) {
                    tooltip
                        .style("opacity", "0")
                        .transition()
                        .remove;
                })
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