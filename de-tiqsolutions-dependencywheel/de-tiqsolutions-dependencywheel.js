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
						  label: "Color and legend",
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
						},
						isAdjacencyList:{
							ref: "isAdjacencyList",
							type: "boolean",
							component: "checkbox",
							label: "Dim1-Dim2 is Adjacency List",
							defaultValue: false
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

          if(qData && qData.qMatrix) {
			//console.log(qData);
              var nodes = [],
                  nodes2 = [],
                  nodesObj = [],
                  nodesObj2 = [],
                  edges = [],
                  edgesObj = [],
			      idx = -99;
              //loop through the rows of the cube and push the values into the array
              $.each(layout.qHyperCube.qDataPages[0].qMatrix, function(index, value) {
                if (!this[0].qIsEmpty) {
                  //Nodes of 1st dimension:
                  if(this[0].qIsOtherCell) {
					           this[0].qText = layout.qHyperCube.qDimensionInfo[0].othersLabel;
                  }
                  if ($.inArray(this[0].qText, nodes) == -1) {
                    nodes.push(this[0].qText);
                    nodesObj.push({id: this[0].qText});
                  }
				          //Nodes of 2nd dimension:
                  if(this[1].qIsOtherCell) {
                    this[1].qText = layout.qHyperCube.qDimensionInfo[1].othersLabel;
                  }
                  if (this[1].qText == '-') {
                    this[1].qText = emtpyDim;
                  }
                  if ($.inArray(this[1].qText, nodes2) == -1) {
                    nodes2.push(this[1].qText);
                    nodesObj2.push({id: this[1].qText});
                  }
                }
                //Edges A->B and B->A
                if (!this[0].qIsEmpty) {
					if ($.inArray(this[0].qText + '-' + this[1].qText, edges) == -1) {
						edges.push(this[0].qText + '-' + this[1].qText);
						edgesObj.push({source: this[0].qText, target: this[1].qText, weight: this[2].qNum});

						if (!isAdjacencyList) {
							idx = $.inArray(this[1].qText + '-' + this[0].qText, edges)
							if (idx == -1) {
								//add the opposite direction (not for real graphs..)
								edgesObj.push({source: this[1].qText, target: this[0].qText, weight: this[2].qNum});
							} else {
								//aggregate
								edgesObj[idx].weight += this[2].qNum;
							}
						}
					}
                }
              });
              nodes.sort(orderByIdAscending);
              nodesObj.sort(orderByIdAscending);
              nodes2.sort(orderByIdAscending);
              nodesObj2.sort(orderByIdAscending);
			  console.log(nodesObj2);
              nodes = nodes.concat(nodes2);
              nodesObj = nodesObj.concat(nodesObj2);
			  console.log(nodesObj);
			  console.log(edgesObj);
			  
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
                packageNames: nodes,
                matrix: createMatrix(nodesObj,edgesObj),
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
			  console.log(svg[0]);
            }
		}
	};
} );

function createMatrix(nodes,edges) {
  var edgeHash = {};
  for (x in edges) {
	var id = edges[x].source + "-" + edges[x].target;
	edgeHash[id] = edges[x];
  }
  matrix = [];
  //create all possible edges
  for (a in nodes) {
	var grid = [];
	for (b in nodes) {
	  var id = nodes[a].id + "-" + nodes[b].id;
	  if (edgeHash[id]) {
		grid.push(edgeHash[id].weight);
	  } else {
		grid.push(0);
	  }
	}
	matrix.push(grid);
  }
  return matrix;
}

function orderByIdAscending(a, b) {
  if (a.id > b.id) {
	return 1;
  }
  return -1;
}
