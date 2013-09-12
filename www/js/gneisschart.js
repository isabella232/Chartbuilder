//add prepend ability
Element.prototype.prependChild = function(child) { this.insertBefore(child, this.firstChild); };

Date.setLocale('en');

//A default configuration 
//Should change to more d3esque methods e.g. http://bost.ocks.org/mike/chart/
var defaultGneissChartConfig = {
	container: "#chartContainer", //css id of target chart container
	editable: true, // reserved for enabling or dissabling on chart editing
	legend: true, // whether or not there should be a legend
	title: "", // the chart title 
	colors: ["#ff4cf4","#ffb3ff","#e69ce6","#cc87cc","#b373b3","#995f99","#804c80","#665266","#158eff","#99cdff","#9cc2e6","#87abcc","#7394b3","#5f7d99","#466780","#525c66"], //this is the order of colors that the 
    type: "line",
	padding :{
		top: 40,
		bottom: 40,
		left: 10,
		right: 10
	},
	xAxis: {
		domain: [0,100],
		prefix: "",
		suffix: "",
		type: "linear",
		formatter: null,
		mixed: true,
		ticks: 5
	},
	yAxis: {
        domain: [null, null],
        tickValues: null,
        prefix: {
            value: "",
            use: "top" //can be "top" "all" "positive" or "negative"
        },
        suffix: {
            value: "",
            use: "top"
        },
        ticks: 4,
        formatter: null,
        color: null
    },
	series: [
		{
			name: "apples",
			data: [5.5,10.2,6.1,3.8],
			source: "Some Org",
			color: null
		},
		{
			name: "oranges",
			data: [23,10,13,7],
			source: "Some Org",
			color: null
		}
	],
	xAxisRef: [
		{
			name: "names",
			data: ["juicyness","color","flavor","travelability"]
		}
	],
	sourceline: "",
	creditline: ""
}

var Gneiss = {
	build: function(config) {
		/*
			Initializes the chart from a config object
		*/
		var g = config
		this.g = config 
		//set container as a jquery object
		g.$container = $(g.container);
		g.all = this;
		
		g.defaults =  {}
		g.defaults.padding = $.extend({}, config.padding); //change
		
		//append svg to container using svg
		g.chart = d3.select(g.container).append("svg")
			.attr("id","chart")
			.attr("width","100%") //set width to 100%
			.attr("height","100%") //set height to 100%
			
		g.width = g.$container.width() //save the width in pixels
		g.height = g.$container.height() //save the height in pixels
		
		//add rect, use as a background to prevent transparency
		g.chart.append("rect")
			.attr("id","ground")
			.attr("width",g.width)
			.attr("height",g.height)
		
        this.calculateColumnWidths();
		this.setYScales(true);
		this.setXScales(true);

        // Create axes
        g.xAxis.axis = d3.svg.axis();

        g.chart.append("g")
			.attr("class",'axis')
			.attr("id","xAxis")

        g.yAxis.axis = d3.svg.axis()
            .scale(g.yAxis.scale)
            .orient("right")
            .tickSize(g.width - g.padding.left - g.padding.right)

        g.chart.append("g")
            .attr("class","axis yAxis")
            .attr("id","rightAxis")
				
		this.setYAxis();
		this.setXAxis();
		
		g.titleLine = g.chart.append("text")
			// .attr("y",0)
			// .attr("x", g.padding.left)
			.attr("id","titleLine")
			.attr("transform","translate(" + g.padding.left + ",-15)")
			.text(g.title)
		
        g.yAxis.line = d3.svg.line();
        
        this.setLineMakers()
		
        g.seriesContainer = g.chart.append("g")
            .attr("id","seriesContainer")
            
        g.legendItemContainer = g.chart.append("g")
            .attr("id","legendItemContainer")

        this.drawSeries();
        this.drawLegend();
		
		g.metaInfo = g.chart.append("g")
			.attr("id","metaInfo")
			.attr("transform","translate(0,"+(g.height-4)+")")
		
		g.sourceLine = g.metaInfo.append("text")
			.attr("text-anchor","end")
			.attr("x",g.width-g.padding.right)
			.attr("class","metaText")
			.text(g.sourceline)
		
		g.creditLine = g.metaInfo.append("text")
			.attr("x",g.padding.left)
			.attr("class","metaText")
			.text(g.creditline)
					
		this.g = g;
		return this;
	},
	numberFormat: d3.format(","),
	resize: function(){
		/*
			Adjusts the size dependent stored variables
		*/
		var g = this.g
		g.width = g.$container.width() //save the width in pixels
		g.height = g.$container.height() //save the height in pixels
		//put a background rect to prevent transparency
		d3.select("rect#ground")
			.attr("width",g.width)
			.attr("height",g.height)
			
		g.metaInfo.attr("transform","translate(0,"+(g.height-4)+")")
		
		this.g = g;
		return this
	},
	setYScales: function(first) {
		/*
			calculates and saves the y-scales from the existing data
		*/
		var g = this.g
		/*
		*
		* Y AXIS SECTION
		*
		*/	
		//calculate number of yaxes and their maxes and mins
		var axisIndex = 0;
		var extremes = [];
		for (var i = g.series.length - 1; i >= 0; i--){
			
			//CHANGE check if there are any extremes for the current axis
			if(extremes === undefined) {
				extremes = []
			}
			
			//calculate extremes of current series and add them to extremes array
			e = d3.extent(g.series[i].data)
			extremes.push(e[0])
			extremes.push(e[1])
		};

        var ex = d3.extent(extremes);

        if(g.yAxis.domain[0] == null) {
            g.yAxis.domain[0] = ex[0]
        }
        
        if(g.yAxis.domain[1]  == null) {
            g.yAxis.domain[1] = ex[1]
        }

        //set extremes in y axis objects and create scales
        if(first || !g.yAxis.scale) {
            g.yAxis.scale = d3.scale.linear()
                .domain(g.yAxis.domain)
        }
        else {
            //set extremes in y axis objects and update scales
            g.yAxis.domain = d3.extent(g.yAxis.domain)
            g.yAxis.scale
                .domain(g.yAxis.domain)
        }
            
        g.yAxis.scale.range([
            g.height - g.padding.bottom,
            g.padding.top
            ]).nice()
		
		this.g = g;
		return this
	},
	setPadding: function() {
		/*
			calulates and stores the proper amount of extra padding beyond what the user specified (to account for axes, titles, legends, meta)
		*/
		var g = this.g
		var padding_top = g.defaults.padding.top,
		padding_bottom = g.defaults.padding.bottom;
		
		if(!g.legend) {
			padding_top = 5;
		}
		padding_top += g.title == "" || g.series.length == 1 ? 0:25
		
		g.padding.top = padding_top
		g.padding.bottom = padding_bottom
		this.g = g
		return this
	},
	setXScales: function(first) {
		/*
			calculate and store the x-scales
		*/
		var g = this.g

		if(first) {
			//create x scales
			
			/*
			*
			* X AXIS SECTION
			*
			*/

			//calculate extremes of axis
            var maxLength = 0;
            for (var i = g.series.length - 1; i >= 0; i--){
                maxLength = Math.max(maxLength, g.series[i].data.length)
            };
            g.xAxis.scale = d3.scale.ordinal()
                .domain(g.xAxisRef[0].data)
                
            g.maxLength = maxLength;
		}
		else {
			//update the existing scales
            var maxLength = 0;
            for (var i = g.series.length - 1; i >= 0; i--){
                maxLength = Math.max(maxLength, g.series[i].data.length)
            };
            g.xAxis.scale.domain(g.xAxisRef[0].data)
            
            g.maxLength = maxLength;
		}

		var rangeArray = []
		//set the range of the x axis
		if (g.type == 'column') {
			rangeArray = [
				g.padding.left + this.g.columnGroupWidth/2,
				g.width - g.padding.right - this.g.columnGroupWidth
				] 
		}
		else {
			rangeArray = [g.padding.left,g.width - g.padding.right]
		};
		
		g.xAxis.scale.rangePoints(rangeArray);
		
		this.g = g;
		return this
		
	},
	setLineMakers: function() {
		var g = this.g

        g.yAxis.line.y(function(d,j){return d||d===0?g.yAxis.scale(d):null})
        g.yAxis.line.x(function(d,j){return d||d===0?g.xAxis.scale(g.xAxisRef[0].data[j]):null})

		this.g = g
		return this
	},
	setYAxis: function() {
		/*
		*
		* Y-Axis Drawing Section
		*
		*/
		var g = this.g;
		
        g.yAxis.axis
            .tickValues(g.yAxis.tickValues?g.yAxis.tickValues:this.helper.exactTicks(g.yAxis.scale.domain(),g.yAxis.ticks))
                
        var axisGroup = g.chart.selectAll("#rightAxis")
            .call(g.yAxis.axis)
				
        //adjust label position and add prefix and suffix
        var topAxisLabel, minY = Infinity;
        
        axisGroup
            .selectAll("g")
            .each(function(d,j) {
                //create an object to store axisItem info
                var axisItem = {}
                
                //store the position of the axisItem
                //(figure it out by parsing the transfrom attribute)
                axisItem.y = parseFloat(d3.select(this)
                    .attr("transform")
                        .split(")")[0]
                            .split(",")[1]
                    )
                
                //store the text element of the axisItem
                axisItem.text = d3.select(this).select("text")

                //store the line element of the axisItem	
                axisItem.line = d3.select(this).select("line")
                    .attr("stroke","#E6E6E6")
                    
                
                //apply the prefix as appropriate
                switch(g.yAxis.prefix.use) {
                    case "all":
                        //if the prefix is supposed to be on every axisItem label, put it there
                        axisItem.text.text(g.yAxis.prefix.value + axisItem.text.text())
                    break;
                    
                    case "positive":
                        //if the prefix is supposed to be on positive values and it's positive, put it there
                        if(parseFloat(axisItem.text.text()) > 0) {
                            axisItem.text.text(g.yAxis.prefix.value + axisItem.text.text())
                        }
                    break;
                    
                    case "negative":
                        //if the prefix is supposed to be on negative values and it's negative, put it there
                        if(parseFloat(axisItem.text.text()) < 0) {
                            axisItem.text.text(g.yAxis.prefix.value + axisItem.text.text())
                        }
                    break;
                    
                    case "top":
                        //do nothing
                    break;
                }
                
                //apply the suffix as appropriate
                switch(g.yAxis.suffix.use) {
                    case "all":
                        //if the suffix is supposed to be on every axisItem label, put it there
                        axisItem.text.text(axisItem.text.text() + g.yAxis.suffix.value)
                    break;

                    case "positive":
                        //if the suffix is supposed to be on positive values and it's positive, put it there
                        if(parseFloat(axisItem.text.text()) > 0) {
                            axisItem.text.text(axisItem.text.text() + g.yAxis.suffix.value)
                        }
                    break;

                    case "negative":
                        //if the suffix is supposed to be on negative values and it's negative, put it there
                        if(parseFloat(axisItem.text.text()) < 0) {
                            axisItem.text.text(axisItem.text.text() + g.yAxis.suffix.value)
                        }
                    break;

                    case "top":
                        //do nothing
                    break;
                }
                
                //find the top most axisItem
                //store its text element
                if(axisItem.y < minY) {
                    topAxisLabel = axisItem.text
                    g.topAxisItem = axisItem
                    minY = axisItem.y
                }
                
                
                if(parseFloat(axisItem.text.text()) == 0) {
                    if(d == 0) {
                        //if the axisItem represents the zero line
                        //change it's class and make sure there's no decimal
                        //axisItem.line.attr("stroke","#666666")
                        d3.select(this).classed("zero", true)
                        axisItem.text.text("0")
                    }
                    else {
                        // A non-zero value was rounded into a zero
                        // hide the whole group
                        this.style("display","none")
                    }
                    
                }
            })
            
        //add the prefix and suffix to the top most label as appropriate
        if(g.yAxis.suffix.use == "top" && g.yAxis.prefix.use == "top") {
            //both preifx and suffix should be added to the top most label
            if(topAxisLabel) {
                topAxisLabel.text(g.yAxis.prefix.value + topAxisLabel.text() + g.yAxis.suffix.value)
            }
            else {
                
            }
            
        }
        else if (g.yAxis.suffix.use == "top") {
            //only the suffix should be added (Because the prefix is already there)
            topAxisLabel.text(topAxisLabel.text() + g.yAxis.suffix.value)
        }
        else if(g.yAxis.prefix.use == "top") {
            //only the prefix should be added (Because the suffix is already there)
            topAxisLabel.text(g.yAxis.prefix.value + topAxisLabel.text())
        }
			
		
        d3.selectAll(".yAxis").style("display",null)
        
        try{
            if(!g.legend || g.series.length == 1) {
                //no legend or only one seriesgit 
                g.titleLine.attr("y",g.topAxisItem.y - 4)
            }
            else {
                g.titleLine.attr("y",g.topAxisItem.y - 25)
            }
        }catch(e){} //fail silently
		
		d3.selectAll(".yAxis").each(function(){this.parentNode.prependChild(this);})
		d3.selectAll("#ground").each(function(){this.parentNode.prependChild(this);})

		this.g = g
		return this
		
	},
	setXAxis: function() {
		var g = this.g

		g.xAxis.axis.scale(g.xAxis.scale)
			.ticks(g.xAxis.ticks)
			.orient("bottom")
			
		g.chart.selectAll("#xAxis")
			.attr("transform","translate(0,"+(g.height - g.padding.bottom + 0)+")")
			.call(g.xAxis.axis)
		
		g.chart.selectAll("#xAxis text")
			.attr("text-anchor", "middle")
			.each(function() {
				var pwidth = this.parentNode.getBBox().width
				var attr = this.parentNode.getAttribute("transform")
				var attrx = Number(attr.split("(")[1].split(",")[0])
				var attry = Number(attr.split(")")[0].split(",")[1])

                // fix labels to not fall off edge 
                if (pwidth/2 + attrx > g.width) {
                    this.setAttribute("x",Number(this.getAttribute("x"))-(pwidth + attrx - g.width + g.padding.right))
                    this.setAttribute("text-anchor","start")
                }
                else if (attrx - pwidth/2 < 0) {
                    this.setAttribute("text-anchor","start")
                }
                g.padding.left = g.defaults.padding.left
			})
		
		this.g = g
		return this
	},
	calculateColumnWidths: function() {
		/*
			Calculate the propper column width for column charts
		*/
		
		var g = this.g
		
		//determine the propper column width
		//								---- Width of chart area ----------     -Num Data pts-  -Num Column Series-
		var columnWidth = Math.floor(((g.width-g.padding.right-g.padding.left) / g.maxLength) / g.series.length) - 3;
		//make sure width is >= 1
		columnWidth = Math.max(columnWidth, 1);
		columnWidth = Math.min(columnWidth, (g.width-g.padding.right-g.padding.left) * 0.075)
		
		this.g.columnWidth = columnWidth;
		this.g.columnGroupWidth = (columnWidth + 1) * g.series.length;
		this.g.columnGroupShift = columnWidth + 1;

		return this
	},
    calculateBarHeights: function() {
        // TODO: placeholder
    },
	drawSeries: function() {
		/*
		*
		* Series Drawing Section
		*
		*/
		var g = this.g
		
		var columnWidth = this.g.columnWidth;
		var columnGroupShift = this.g.columnGroupShift;
		
        // COLUMNS
        var columnGroups = g.seriesContainer.selectAll("g.seriesColumn");
        
        if (g.type == 'column') {
            columnGroups = columnGroups
                .data(g.series)
                .attr("fill",function(d,i){return d.color? d.color : g.colors[i+g.series.length]})
            
            columnGroups.enter()
                .append("g") 
                    .attr("class","seriesColumn")
                    .attr("fill",function(d,i){return d.color? d.color : g.colors[i+g.series.length]})
                    .attr("transform",function(d,i){return "translate("+(i*columnGroupShift - (columnGroupShift * (g.series.length-1)/2))+",0)"})
                
            columnGroups.transition()
                .duration(500)
                .attr("transform",function(d,i){return "translate("+(i*columnGroupShift - (columnGroupShift * (g.series.length-1)/2))+",0)"})
        
            columnGroups.exit().remove()
        
            columnRects = columnGroups.selectAll("rect")
                .data(function(d,i){return d.data})
            
            columnRects.enter()
                    .append("rect")
                    .attr("width",columnWidth)
                    .attr("height", function(d,i) {return Math.abs(g.yAxis.scale(d) - g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain())))})
                    .attr("x",function(d,i) {return g.xAxis.scale(Gneiss.g.xAxisRef[0].data[i])  - columnWidth/2})
                    .attr("y",function(d,i) {return (g.yAxis.scale(d)-g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain()))) >= 0 ? g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain())) : g.yAxis.scale(d)})
        
            columnRects.transition()
                .duration(500)
                .attr("width",columnWidth)
                .attr("height", function(d,i) {return Math.abs(g.yAxis.scale(d) - g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain())))})
                .attr("x",function(d,i) {return g.xAxis.scale(i) - columnWidth/2})
                .attr("y",function(d,i) {return (g.yAxis.scale(d)-g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain()))) >= 0 ? g.yAxis.scale(Gneiss.helper.columnXandHeight(d,g.yAxis.scale.domain())) : g.yAxis.scale(d)})
            
            columnRects.exit().remove()

            columnGroups.each(function(){this.parentNode.appendChild(this);})
        } else {
            columnGroups.remove();
        }
    
        // LINES
        var lineSeries = g.seriesContainer.selectAll("path");
        var lineSeriesDotGroups = g.seriesContainer.selectAll("g.lineSeriesDots");

        if (g.type == 'line') {
            lineSeries = lineSeries
                .data(g.series)
                .attr("stroke",function(d,i){return d.color? d.color : g.colors[i]});

            lineSeries.enter()
                .append("path")
                    .attr("d",function(d,j) { pathString = g.yAxis.line(d.data).split("L0,0L").join("M0,0L"); return pathString;})
                    .attr("class","seriesLine")
                    .attr("stroke",function(d,i){return d.color? d.color : g.colors[i]})
                    .attr("stroke-width",3)
                    .attr("stroke-linejoin","round")
                    .attr("stroke-linecap","round")
                    .attr("fill","none");

            lineSeries.transition()
                .duration(500)
                .attr("d",function(d,j) { pathString = g.yAxis.line(d.data).split("L0,0L").join("M0,0M"); return pathString;})

            lineSeries.exit().remove()
    
    
            //Add dots to the appropriate line series
            lineSeriesDotGroups = lineSeriesDotGroups
                .data(g.series)
                .attr("fill",function(d,i){return d.color? d.color : g.colors[i]})
        
            lineSeriesDotGroups
                .enter()
                .append("g")
                .attr("class","lineSeriesDots")
                .attr("fill", function(d,i){return d.color? d.color : g.colors[i]})
            
            lineSeriesDotGroups.exit().remove()
        
            lineSeriesDots = lineSeriesDotGroups.filter(function(d){return d.data.length < 15})
                .selectAll("circle")
                .data(function(d,i){return d.data})
                
            lineSeriesDotGroups.filter(function(d){return d.data.length > 15})
                .remove()
            
            
            lineSeriesDots.enter()
                .append("circle")
                .attr("r",1)
                .attr("transform",function(d,i){
                        var y = d || d ===0 ? g.yAxis.scale(d) : -100;
                        return "translate("+ g.xAxis.scale(Gneiss.g.xAxisRef[0].data[i]) + "," + y + ")";
                    })
        
            lineSeriesDots.transition()
                .duration(500)
                .attr("transform",function(d,i){
                        var y = d || d ===0 ? g.yAxis.scale(d) : -100;
                        return "translate("+ g.xAxis.scale(Gneiss.g.xAxisRef[0].data[i]) + "," + y + ")";
                    })
        
            lineSeriesDots.exit().remove()

            lineSeries.each(function(){if(this.parentNode){this.parentNode.appendChild(this);}})
			lineSeriesDotGroups.each(function(){if(this.parentNode){this.parentNode.appendChild(this);}})
        } else {
            lineSeries.remove();
            lineSeriesDotGroups.remove();
        }
                        
        // SCATTER
        var scatterGroups = g.seriesContainer.selectAll("g.seriesScatter");

        if (g.type == 'scatter') {
            scatterGroups = scatterGroups
                .data(g.series)
                .attr("fill", function(d,i){return d.color? d.color : g.colors[i]})
            
            scatterGroups.enter()
                .append("g")
                .attr("class","seriesScatter")
                .attr("fill",function(d,i){return d.color? d.color : g.colors[i+g.series.length+g.series.length]})
            
            scatterGroups.exit().remove()
            
            scatterDots = scatterGroups
                .selectAll("circle")
                .data(function(d){return d.data})
                
            scatterDots.enter()
                    .append("circle")
                    .attr("r",4)
                    .attr("stroke","#fff")
                    .attr("stroke-width","1")
                    .attr("transform",function(d,i){
                        return "translate("+g.xAxis.scale(Gneiss.g.xAxisRef[0].data[i]) + "," + g.yAxis.scale(d) + ")"
                        })
                
            scatterDots.transition()
                    .duration(500)
                    .attr("transform",function(d,i){
                        return "translate("+g.xAxis.scale(Gneiss.g.xAxisRef[0].data[i]) + "," + g.yAxis.scale(d) + ")"
                        })

            scatterGroups.each(function(){this.parentNode.appendChild(this);})
			scatterDots.each(function(){this.parentNode.appendChild(this);})
        } else {
            scatterGroups.remove();
        }
			
		this.g = g;
		return this
		
		
	},
	drawLegend: function() {
		var g = this.g;
		var legendItemY;
		
		//remove current legends
		g.legendItemContainer.selectAll("g.legendItem").remove()
		
        //add legend to chart
        var legendGroups = g.legendItemContainer.selectAll("g")
            .data(g.series);

        var legItems = 	legendGroups.enter()
            .append("g")
            .attr("class","legendItem")
            .attr("transform",function(d,i) {
                return "translate("+g.padding.left+","+(g.padding.top-25)+")"
            });

        legendGroups.exit().remove()

        var legLabels = legItems.append("text")
                .filter(function(){return g.series.length > 1})
                .attr("class","legendLabel")
                .attr("x",15)
                .attr("y",10)
                //.attr("fill",function(d,i){return d.color? d.color : g.colors[i]})
                .text(function(d,i){return d.name});
        
        //if there is more than one line
        if(g.series.length > 1) {
            legItems.append("rect")
                .attr("width",10)
                .attr("height",10)
                .attr("x",0)
                .attr("y",0)
                .attr("fill", function(d,i){return d.color? d.color : g.colors[i]})

            legendGroups.filter(function(d){return d != g.series[0]})
                .transition()
                .duration(50)
                .delay(function(d,i){return i * 50 + 50})
                .attr("transform",function(d,i) {
                    //label isn't for the first series
                    var prev = d3.select(legendGroups[0][i])
                    var prevWidth = parseFloat(prev.node().getBBox().width)
                    var prevCoords = g.all.helper.transformCoordOf(prev)

                    var cur = d3.select(this)
                    var curWidth = parseFloat(cur.node().getBBox().width)
                    var curCoords = g.all.helper.transformCoordOf(cur)

                    legendItemY = prevCoords.y;
                    var x = prevCoords.x + prevWidth + 15
                    if(x + curWidth > g.width) {
                        x = g.padding.left
                        legendItemY += 15;						
                    }
                    return "translate("+x+","+legendItemY+")"
            })

			this.g = g;	
		}
		
		this.g = g
		return this
	},
	updateMetaAndTitle: function() {
		var g = this.g
		g.metaInfo.attr("transform","translate(0,"+(g.height-4)+")")
		this.g = g
		return this
	},
	redraw: function() {
		/*
			Redraw the chart
		*/
		var g = this.g
		
		this.calculateColumnWidths()
        this.setLineMakers()

		this.setPadding()
			.setYScales()
			.setXScales()
			.setYAxis()
			.setXAxis()
			.drawSeries()
            .drawLegend()
			.updateMetaAndTitle();	
		return this
	},
	randomizeData: function(d) {
		delta = 10 * (Math.random() - 0.5)
		for (var i = d.length - 1; i >= 0; i--){
			d[i] = d[i] + ((Math.random()-0.5)*5) + delta
		};
		return d
	},
	helper: {
		multiextent: function(a,key) {
			//a function to find the max and min of multiple arrays
			var data = [],ext;
			if(key) {
				//if there is a key function
				for (var i = a.length - 1; i >= 0; i--){
					ext = d3.extent(key(a[i]))
					data.push(ext[0])
					data.push(ext[1])
				}
			}
			else {
				for (var i = a.length - 1; i >= 0; i--){
					ext = d3.extent(a[i])
					data.push(ext[0])
					data.push(ext[1])
				};
			}
			return d3.extent(data)
		},
		columnXandHeight: function(d,domain) {
			//a function to find the propper value to cut off a column
			if(d > 0 && domain[0] > 0) {
				return domain[0]
			}
			else if (d < 0 && domain[1] < 0) {
				return domain[1]
			}
			
			return 0
		},
		exactTicks: function(domain,numticks) {
			numticks -= 1;
			var ticks = [];
			var delta = domain[1] - domain[0];
			
			for (var i=0; i < numticks; i++) {
				ticks.push(domain[0] + (delta/numticks)*i);
			};
			ticks.push(domain[1])
			
			if(domain[1]*domain[0] < 0) {
				//if the domain crosses zero, make sure there is a zero line
				var hasZero = false;
				for (var i = ticks.length - 1; i >= 0; i--){
					//check if there is already a zero line
					if(ticks[i] == 0) {
						hasZero = true;
					}
				};
				if(!hasZero) {
					ticks.push(0)
				}
			}
			
			return ticks;
		},
		transformCoordOf: function(elem){
			var trans = elem.attr("transform").split(",")
			return {x:parseFloat(trans[0].split("(")[1]) , y:parseFloat(trans[1].split(")")[0])}
		}
	},
	q: {}
}
