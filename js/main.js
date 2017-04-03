//wrap everything in a self-executing anonymous function to move to local scope
(function(){
	//variables for data join
	var attrArray=["POP","ADO","LE","UEM","PAR"]; //list of attributes
	var expressed=attrArray[0]; //initial attribute
	
//begin script when window loads
window.onload=setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
	var width=window.innerWidth*0.55,
		height=560;
		
	//create new svg container for the map
	var map=d3.select("body")
		.append("svg")
		.attr("class","map")
		.attr("width",width)
		.attr("height",height);
		
	//create Robinson projection for the world countries
	//will implement projection transition later (Mollweide equal area projection)
	var projection=d3.geoRobinson()
		.scale(168)
		.precision(.1)
		.translate([width/2,height/2]);
	
	var path=d3.geoPath()
		.projection(projection);
	
	//use d3.queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv,"data/csvData.csv") //load attributes from csv
		.defer(d3.json,"data/WorldCountries.topojson") //load choropleth spatial data
		.await(callback);
		
	function callback(error, csvData, world){
		//place graticule on the map
		setGraticule(map,path);
		
		//translate europe and France TopoJSONs
		var worldCountries=topojson.feature(world,world.objects.WorldCountries).features;
		
		//join csv data to GeoJSON enumeration uits
		worldCountries=joinData(worldCountries,csvData);
		
		//create the color scale
		var colorScale=makeColorScale(csvData);
		
		//add enumeration units to the map
		setEnumerationUnits(worldCountries,map,path,colorScale);
		
		//add coordinated visualization to the map
		setChart(csvData,colorScale);
	};
};

//function to create color scale generator
function makeColorScale(csvData){
	var colorClasses=[
		"#ffffcc",
		"#c2e699",
		"#78c679",
		"#31a354",
		"#006837"
	];
	
	//create color scale generator
	var colorScale=d3.scaleQuantile()
		.range(colorClasses);
	
	//build array of all values of the expressed attribute
	var domainArray=[];
	for (var i=0; i<csvData.length; i++){
		var val=parseFloat(csvData[i][expressed]);
		domainArray.push(val);
	};
	//assign array of expressed values as scale domain
	colorScale.domain(domainArray);
	
	return colorScale;
};
	/*
	//build two-value array of minimum and maximum expressed attribute values
	var minmax=[
		d3.min(data, function(d){return parseFloat(d[expressed]);}),
		d3.min(data, function(d){return parseFloat(d[expressed]);})
	];
	//assign two-value array as scale domain
	colorScale.domain(minmax);
	*/
	
	/*
	//build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
	*/
	
	//console.log(colorScale.quantiles())

//function to set up graticules on the map
function setGraticule(map,path){
	//create graticule generator
	var graticule=d3.geoGraticule()
		.step([21,21]); //place graticule lines every 5 degrees of longitude and latitude
		
	//create graticule background
	var gratBackground=map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class","gratBackground") //assign class for styling
		.attr("d",path) //project graticule
		
	//create graticule lines
	var gratLines=map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
		.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class","gratLines") //assign class for styling
		.attr("d",path); //project graticule lines
};

//function to join csv attribute data to the enumeration units
function joinData(worldCountries,csvData){
	//loop through csv to assign each set of csv attribute values to geojson region
	for (var i=0; i<csvData.length; i++){
		var csvCountry=csvData[i]; //the current region
		var csvKey=csvCountry.ADM0_A3; //the CSV primary key
			
		//loop through geojson regions to find correct region
		for (var a=0; a<worldCountries.length; a++){
			var geojsonProps=worldCountries[a].properties; //the current region geojson properties
			var geojsonKey=geojsonProps.ADM0_A3; //the geojson primary key
				
			//where primary keys match, transfer csv data to geojson properties object
			if (geojsonKey==csvKey){
				//assign all attributes and values
				attrArray.forEach(function(attr){
					var val=parseFloat(csvCountry[attr]); //get csv attribute value
					geojsonProps[attr]=val; //assign attribute and value to geojson properties
				});
			};
		};
	};
	return worldCountries;
};

//function to set up enumeration units and to color the units based on joined attributes
function setEnumerationUnits(worldCountries,map,path,colorScale){
	//console.log(worldCountries)
	//add world countries to map
	var countries=map.selectAll(".countries")
		.data(worldCountries)
		.enter()
		.append("path")
		.attr("class",function(d){
			return "countries "+d.properties.ADM0_A3;
		})
		.attr("d",path)
		.style("fill",function(d){
			return choropleth(d.properties,colorScale);
		});
};

//function to test for data value and return color
function choropleth(props, colorScale){
	//make sure attribute value is a number
	var val=parseFloat(props[expressed]);
	//if attribute value exists, assign a color; otherwise assign gray
	if (val && val!=NaN){
		return colorScale(val);
	} else {
		return "#FFF";
	};
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
	//chart frame dimensions
	var chartWidth=window.innerWidth*0.5,
	    chartHeight=360,
		leftPadding=25,
		rightPadding=2,
		topBottomPadding=5,
		chartInnerWidth=chartWidth-leftPadding-rightPadding,
		chartInnerHeight=chartHeight-topBottomPadding*2,
		translate="translate(" + leftPadding+ "," +topBottomPadding+ ")";
		
	//create a second svg element to hold the bar chart
	var chart=d3.select("body")
		.append("svg")
		.attr("width",chartWidth)
		.attr("height",chartHeight)
		.attr("class","chart");
	
	//create a rectangle for chart background fill
	var chartBackground=chart.append("rect")
		.attr("class","chartBackground")
		.attr("width",chartInnerWidth)
		.attr("height",chartInnerHeight)
		.attr("transform",translate);
	
	//create a scale to size bars proportionally to frame and for axis
	var yScale=d3.scaleLinear()
		.range([350,0])
		.domain([0,100]);
		//.range([0,chartHeight])
		//.domain([0,105]);
	
	//set bars for each province
	var bars=chart.selectAll(".bar")
		//console.log(csvData)
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a,b){
			return b[expressed]-a[expressed]
		})
		.attr("class",function(d){
			return "bar "+d.adm1_code;
		})
		.attr("width",chartInnerWidth/csvData.length-1)
		.attr("x",function(d,i){
			return i*(chartInnerWidth/csvData.length)+leftPadding;
		})
		.attr("height",function(d,i){
			return 350-yScale(parseFloat(d[expressed]));
		})
		.attr("y",function(d,i){
			return yScale(parseFloat(d[expressed]))+topBottomPadding;
		})
		.style("fill",function(d){
			return choropleth(d,colorScale);
		});
	
	//create a text element for the chart title
	var chartTitle=chart.append("text")
		.attr("x",40)
		.attr("y",40)
		.attr("class","chartTitle")
		.text("Percentage of Female Population in Each Country");
		//.text("Percentage of Female Population "+expressed[3]+" in each country");
		
	//create vertical axis generator
	var yAxis=d3.axisLeft()
		.scale(yScale);
	
	//place axis
	var axis=chart.append("g")
		.attr("class","axis")
		.attr("transform",translate)
		.call(yAxis);
		
	//create frame for chart border
	var chartFrame=chart.append("rect")
		.attr("class","chartFrame")
		.attr("width",chartInnerWidth)
		.attr("height",chartInnerHeight)
		.attr("transform",translate);
};

})(); 