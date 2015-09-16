/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - (c) 2015 TIQ Solutions, Leipzig, Germany
Tested on Qlik Sense 2.1.1
*/
requirejs.config({
	shim : {
		"extensions/de-tiqsolutions-dependencywheel/d3.dependencyWheel" : {
			"deps" : ["extensions/de-tiqsolutions-dependencywheel/d3.min"]
		}
	}
});
define(["jquery", "qlik", "./d3.dependencyWheel", "./chroma.min"], function($, qlik, dependencyWheel, chroma) {
	return {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 3,
					qHeight: 500
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
				settings: {
					uses: "settings",
					items : {
					  colorSchema: {
						  ref: "colorSchema",
						  type: "string",
						  component: "dropdown",
						  label: "Color and Legend",
						  options: 
							[ {
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
						}
					}
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},

		paint: function ( $element, layout ) {
 
		  $element.html("");  
		  
          var qData = layout.qHyperCube.qDataPages[0];
		  var id = "container_"+ layout.qInfo.qId;
          var emtpyDim = "n/a";
  
		  // custom properties
		  var isAdjacencyList = layout.isAdjacencyList,
		  	  colorSchema = layout.colorSchema.split(",");

		var dimensionLabels = layout.qHyperCube.qDimensionInfo.map(function(d) {
			return d.qFallbackTitle;
		});
		var qDimensionType = layout.qHyperCube.qDimensionInfo.map(function(d) {
			return d.qDimensionType;
		});
		var qDimSort = layout.qHyperCube.qDimensionInfo.map(function(d) {
			return d.qSortIndicator;
		});

		if(qData && qData.qMatrix) {
			//console.log(qData);
              var nodes = [],
                  nodes2 = [],
                  nodesObj = [],
                  nodesObj2 = [],
                  edges = [],
                  edgesObj = [],
				  dim1cnt = 0,
			      idx = -99,
				  node1Id = "",
				  node2Id = "",
				  edgeId = "",
				  edgeIdRev = "";
              //loop through the rows of the cube and push the values into the array
              $.each(layout.qHyperCube.qDataPages[0].qMatrix, function(index, value) {
                if (!this[0].qIsEmpty) {
                  //Nodes of 1st dimension:
                  if(this[0].qIsOtherCell) {
						this[0].qText = layout.qHyperCube.qDimensionInfo[0].othersLabel;
                  }
				  node1Id = dimensionLabels[0] + ":" + this[0].qText;
                  if ($.inArray(this[0].qText, nodes) == -1) {
                    nodes.push(this[0].qText);
                    nodesObj.push({id: node1Id, label: this[0].qText, dim: 0, num: this[0].qNum, element: this[0].qElemNumber});
                  }
				          //Nodes of 2nd dimension:
                  if(this[1].qIsOtherCell) {
                    this[1].qText = layout.qHyperCube.qDimensionInfo[1].othersLabel;
                  }
                  if (this[1].qText == '-') {
                    this[1].qText = emtpyDim;
                  }
				  node2Id = dimensionLabels[1] + ":" + this[1].qText;
                  if ($.inArray(this[1].qText, nodes2) == -1) {
					nodes2.push(this[1].qText);
                    nodesObj2.push({id: node2Id, label: this[1].qText, dim: 1, num: this[1].qNum, element: this[1].qElemNumber});
                  }
                }
                //Edges A->B and B->A
                if (!this[0].qIsEmpty) {
					edgeId = node1Id + "-" + node2Id;
					if ($.inArray(edgeId, edges) == -1) {
						edges.push(edgeId);
						edgesObj.push({id: edgeId, source: node1Id, target: node2Id, weight: this[2].qNum});
					}
					edgeIdRev = node2Id + "-" + node1Id;
					idx = $.inArray(edgeIdRev, edges);
					if (idx == -1) {
						//add the opposite direction (not for real graphs..)
						edges.push(edgeIdRev);
						edgesObj.push({id: edgeIdRev, source: node2Id, target: node1Id, weight: this[2].qNum});
					}
                }
              });
			dim1cnt = nodes.length;
			
			// Sorting Dim2
			if (qDimensionType[1] == "N") {
				// Numeric
				if (qDimSort[1] == "A") {
					nodesObj2.sort(function(o1,o2){ return o1.num - o2.num; });
				} else {
					nodesObj2.sort(function(o1,o2){ return o2.num - o1.num; });
				}
			} else {
				// Alphabetic
				if (qDimSort[1] == "A") {
					nodesObj2.sort(function(a, b) {
						var x = a.id.toLowerCase(), y = b.id.toLowerCase();   
						return x < y ? -1 : x > y ? 1 : 0;
					});
				} else {
					nodesObj2.sort(function(a, b) {
						var y = a.id.toLowerCase(), x = b.id.toLowerCase();   
						return x < y ? -1 : x > y ? 1 : 0;
					});
				}
			}
			nodes2 = nodesObj2.map(function(d) {
				return d.label;
			});
			
              nodes = nodes.concat(nodes2);
              nodesObj = nodesObj.concat(nodesObj2);
			  
              //not needed anymore
              nodes2 = [];
              nodesObj2 = [];

			  var colors = chroma.interpolate.bezier(colorSchema),			  
				colorPalette = [1, 1],
				colorPaletteSize = nodes.length,
				colorPaletteStep = 1 / (colorPaletteSize - 1);
			for (i = 0; i < colorPaletteSize; i++) {
				colorPalette[i] = colors(i * colorPaletteStep);
			}
				
              var data = {
				self: this,
                packageNames: nodes,
				nodes: nodesObj,
				dim1cnt: dim1cnt,
                matrix: createMatrix(nodesObj,edges,edgesObj),
				colorPalette: colorPalette
              };
	
              var elementWidth = Math.min($element.width(),$element.height());
              var chartWidth = Math.floor(elementWidth * 0.76);

              $element.append($('<div />').attr("id", id).width($element.width()).height($element.height()));

              var options = {
                elementId: id,
                width: chartWidth,
                margin: chartWidth * .15,
                padding: 0.02,
                maxStrLength: 15
              };

              var chart = d3.chart.dependencyWheel(options);
            	d3.select('#'+id)
                .datum(data)
                .call(chart);

              var svg = $('#'+id+' svg');
              var bb = svg[0].getBBox();
              svg[0].setAttribute('viewBox',[bb.x,bb.y,bb.width,bb.height].join(','));			  
            }
		}
	};
} );

function createMatrix(nodes,edges,edgesObj) {
  var id = "", pos = 0, matrix = [];
  for (a in nodes) {
	var grid = [];
	for (b in nodes) {
	  if (a === b) {
			grid.push(0);
	  } else {
		  id = nodes[a].id + "-" + nodes[b].id;
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