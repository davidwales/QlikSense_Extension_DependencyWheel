requirejs.config({
	shim : {
		"extensions/de-tiqsolutions-dependencywheel/d3.dependencyWheel" : {
			"deps" : ["extensions/de-tiqsolutions-dependencywheel/d3.min", "extensions/de-tiqsolutions-dependencywheel/dependencywheelhelper"]
		}
	}
});
define(["jquery", "./d3.dependencyWheel"], function($, properties) {
	
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
					uses: "settings"
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},

		paint: function ( $element, layout ) {
          
          var qData = layout.qHyperCube.qDataPages[0];
        	var id = "container_"+ layout.qInfo.qId;
          var emtpyDim = "n/a";
          
          if(qData && qData.qMatrix) {
              var nodes = [];
              var nodes2 = [];
              var nodesObj = [];
              var nodesObj2 = [];
              var edges = [];
              var edgesObj = [];
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
                    //add the opposite direction (not for real graphs..)
                    edgesObj.push({source: this[1].qText, target: this[0].qText, weight: this[2].qNum});
                  }
                }
              });
              nodes2.sort();
              nodesObj2.sort(orderByIdAscending);
              nodes = nodes.concat(nodes2);
              nodesObj = nodesObj.concat(nodesObj2);
              //not needed anymore
              nodes2 = [];
              nodesObj2 = [];

              $('#'+id).html("");
  
              var data = {
                packageNames: nodes,
                matrix: createMatrix(nodesObj,edgesObj)
              };
	
              var elementWidth = Math.min($element.width(),$element.height());
              var chartWidth = Math.floor(elementWidth * 0.76);

              //$element.html("<div id='"+id+"' style='position: relative;' width='"+elementWidth+"px' height='"+elementWidth+"px'></div>" );

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
