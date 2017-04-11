//wrap everything in a self-executing anonymous function to move to local scope
  document.addEventListener('DOMContentLoaded', function(){
      Typed.new('.element', {
        strings: ["hello.", "Second sentence."],
        typeSpeed: 0
      });
  });
(function(){
//global variables prepared to be used in any of the following functions
var attrArray=["Percentage of Female Population","Proportion of National Parliaments Seats Held by Women","Life Expectancy at Birth (Female)","Adolescent Fertility Rate","Female Unemployment Rate"]; //list of attributes
var expressed=attrArray[0]; //initial attribute
var squareWidth=15;
var squareHeight=30;
var minmax=[];
var chartLabels=[];
var InfoPanelDiv=[];
var IntroPanelDiv=[];
var title_variable1="Percentage of Female Population";
var title_variable2="Proportion of National Parliaments Seats Held by Women";
var title_variable3="Life Expectancy at Birth (Female)";
var title_variable4="Adolescent Fertility Rate";
var title_variable5="Female Unemployment Rate";
var info_variable1="Generally female population is about half of the total population in one country. However, the variations of this parameter may also indicate different attitudes toward gender equality across nations.";
var info_variable2="The women's proportion in national parliment seats is a relatively direct indicator about women's power or influence in law and or government systems. According to statistics by the World Bank, this parameter has been continuously increasing since 1990.";
var info_variable3="Female's life expectancy is a statistical measure of the average time a female is expected to live, based on the year of their borth, their current age, etc. This can be an indicator for the statuses of regional public health care for women and children.";
var info_variable4="Also known as adolescent birth rate, the parameter measures the annual number of births to women from age 15 to 19 per 1000 women in the age group. It can be associated with the country's economy, public health, and or gender equality statuses.";
var info_variable5="The percentage of umemployed women in total female labor force can be a relatively direct indicator for gender equality statuses in one country's job markets. Women's economic and social rights can be related with and impacted by this parameter.";

//chart frame dimensions

var chartWidth=window.innerWidth*0.425,
	chartHeight=200,
	leftPadding=25,
	rightPadding=2,
	topBottomPadding=5,
	chartInnerWidth=chartWidth-leftPadding-rightPadding,
	chartInnerHeight=chartHeight-topBottomPadding*2,
	translate="translate(" + leftPadding+ "," +topBottomPadding+ ")";
	
//create a scale to size squares proportionally to frame and for axis
var yScale=d3.scaleLinear()
	.range([463,0])
	.domain([0,100]);
	
//begin script when window loads
window.onload=setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
	var width=window.innerWidth*0.65,
		height=550,
		centered;
		
	//create new svg container for the map
	var map=d3.select("body")
		.append("svg")
		.attr("class","map")
		.attr("width",width)
		.attr("height",height);
	
	var projectionOptions=[
		{name: "Robinson (Compromise)", projection: d3.geoRobinson()},
		{name: "Kavrayskiy VII (Compromise)", projection: d3.geoKavrayskiy7()},
		{name: "Wagner VI (Compromise)", projection: d3.geoWagner7()},
		{name: "Boggs (Equal-Area)", projection: d3.geoBoggs()},
		{name: "Eckert II (Equal-Area)", projection: d3.geoEckert2().scale(165)},
		{name: "Eckert IV (Equal-Area)", projection: d3.geoEckert4().scale(180)},
		{name: "Eckert VI (Equal-Area)", projection: d3.geoEckert6().scale(170)},
		{name: "Goode Homolosine (Equal-Area)", projection: d3.geoHomolosine()},
		{name: "Nell–Hammer (Equal-Area)", projection: d3.geoNellHammer()},
		{name: "Sinu-Mollweide (Equal-Area)", projection: d3.geoSinuMollweide()}
	];
	
	projectionOptions.forEach(function(o) {
		o.projection.rotate([0, 0]).center([0, 0]);
	});
	
	i = 0,
	n = projectionOptions.length - 1;
	
	var projection = projectionOptions[i].projection;

	var path = d3.geoPath()
		.projection(projection);

	map.append("defs").append("path")
		.datum({type: "Sphere"})
		.attr("id", "sphere")
		.attr("d", path);
	
	map.append("use")
		.attr("class", "stroke")
		.attr("xlink:href", "#sphere");

	map.append("use")
		.attr("class", "fill")
		.attr("xlink:href", "#sphere");
	
	var menu = d3.select("#projection-menu")
		.on("change", change);
		
	menu.selectAll("option")
		.data(projectionOptions)
		.enter().append("option")
		.text(function(d) { return d.name; });
	
	function loop() {
	  var j = Math.floor(Math.random() * n);
	  menu.property("selectedIndex", i = j + (j >= i));
	  update(projectionOptions[i]);
	}
	
	function change() {
		update(projectionOptions[this.selectedIndex]);
	}
	
	function update(option) {
		map.selectAll("path")
			.transition()
			.duration(400)
			.attrTween("d", projectionTween(projection, projection = option.projection));
	}

	function projectionTween(projection0, projection1) {
	  return function(d) {
		var t = 0;

		var projection = d3.geoProjection(project)
			.scale(1)
			.translate([width/2.2, height/2.2]);

		var path = d3.geoPath()
			.projection(projection);

		function project(λ, φ) {
		  λ *= 180 / Math.PI, φ *= 180 / Math.PI;
		  var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
		  return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
		}

		return function(_) {
		  t = _;
		  return path(d);
		};
	  };
	}
	
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
		
		//add dropdown menu for attribute selection
		createDropdown1(csvData);
		
		//update the center of all maps with different projections
		update(projectionOptions[0]);
		
		//create infopanel for each variable
		createInfoPanel(csvData)
		
		//create introduction panel for the entire map
		createIntroPanel()
		
		//add metadata information to the end of the map
		metaData()
	};
};

//function to create color scale generator
function makeColorScale(data){
	var colorClasses1=[
		"#ffffcc",
		"#c2e699",
		"#78c679",
		"#31a354",
		"#006837"
	];
	
	var colorClasses2=[
		"#ffffd4",
		"#fdcc8a",
		"#fc8d59",
		"#e34a33",
		"#b30000"
	];
	
	if (expressed=="Adolescent Fertility Rate" || expressed=="Female Unemployment Rate"){
		appliedColor=colorClasses2
	} else{
		appliedColor=colorClasses1
	};
	
	//create color scale generator
	var colorScale=d3.scaleThreshold()
		.range(appliedColor);
		
	for (var i in data){
		if (expressed=="Percentage of Female Population"){
			minmax=[49,50,51,52,54];
		} else if (expressed=="Proportion of National Parliaments Seats Held by Women"){
			minmax=[11,17,24,32,64];
		} else if (expressed=="Life Expectancy at Birth (Female)"){
			minmax=[65,74,78,82,87];
		} else if (expressed=="Adolescent Fertility Rate"){
			minmax=[10,26,56,88,201];
		} else if (expressed=="Female Unemployment Rate"){
			minmax=[4,7,10,17,39];
		};
	};
	//assign two-value array as scale domain
	colorScale.domain(minmax);
	
	return colorScale;
	/*
	//create color scale generator
	var colorScale=d3.scaleQuantile()
		.range(appliedColor);
	
	//build array of all values of the expressed attribute
	var domainArray=[];
	for (var i=0; i<data.length; i++){
		var val=parseFloat(data[i][expressed]);
		domainArray.push(val);
	};
	//assign array of expressed values as scale domain
	colorScale.domain(domainArray);
	*/
};

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
	
function setEnumerationUnits(worldCountries,map,path,colorScale){
	//console.log(franceRegions)
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
		})
		.on("mouseover",function(d){
			highlight(d.properties);
		})
		.on("mouseout",function(d){
			dehighlight(d.properties);
		})
		.on("mousemove",moveLabel)
		var countriesColor = countries.append("desc")
            .text(function(d){
            return choropleth(d.properties, colorScale);
            });
};

//function to test for data value and return color
function choropleth(props, colorScale){
	//make sure attribute value is a number
	var val=parseFloat(props[expressed]);
	//if attribute value exists, assign a color; otherwise assign gray
	if (typeof val=='number' && !isNaN(val)){
		return colorScale(val);
	} else {
		return "#FFF";
	};
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
	//create a second svg element to hold the bar chart
	var chart=d3.select("body")
		.append("svg")
		.attr("width",chartWidth)
		.attr("height",chartHeight)
		.attr("class","chart");
		
	chartLabels=d3.select("body")
		.append("div")
		.attr("class","chartLabels");
	
	//set squares for each countries in the chart
	var squares=chart.selectAll(".square")
		.data(csvData)
		.enter()
		.append("rect")
		.attr("class",function(d){
			return "square "+d.ADM0_A3;
		})
		.attr("width",squareWidth+"px")
		.attr("height",squareHeight+"px");
		
	updateChart(squares,csvData.length,colorScale);
	
	var desc=squares.append("desc")
		.text(function(d){
			return choropleth(d,colorScale)
		});
};

//function to position, size, and color squares in chart
function updateChart(squares,n,colorScale){
	var xValue=0;
	var yValue=0;
	var colorObjectArray=[];
	
	//create object array to hold a count of the number of countries in each class
	for (i=0; i<appliedColor.length; i++){
		var colorObject={"color":appliedColor[i],"count":0};
		colorObjectArray.push(colorObject);
	};
	
	var chartLabel=chartLabels.html(function(d){
		if (expressed=="Percentage of Female Population"){
			return minmax[0]+"%"+"<br>"
			+minmax[1]+"%"+"<br>"
			+minmax[2]+"%"+"<br>"
			+minmax[3]+"%"+"<br>"
			+minmax[4]+"%"+"<br>";
		} else if (expressed=="Proportion of National Parliaments Seats Held by Women"){
			return minmax[0]+"%"+"<br>"
			+minmax[1]+"%"+"<br>"
			+minmax[2]+"%"+"<br>"
			+minmax[3]+"%"+"<br>"
			+minmax[4]+"%"+"<br>";
		} else if (expressed=="Life Expectancy at Birth (Female)"){
			return minmax[0]+"<br>"
			+minmax[1]+"<br>"
			+minmax[2]+"<br>"
			+minmax[3]+"<br>"
			+minmax[4]+"<br>";
		} else if (expressed=="Adolescent Fertility Rate"){
			return minmax[0]/10+"<br>"
			+minmax[1]/10+"<br>"
			+minmax[2]/10+"<br>"
			+minmax[3]/10+"<br>"
			+minmax[4]/10+"<br>";
		} else if (expressed=="Female Unemployment Rate"){
			return minmax[0]+"%"+"<br>"
			+minmax[1]+"%"+"<br>"
			+minmax[2]+"%"+"<br>"
			+minmax[3]+"%"+"<br>"
			+minmax[4]+"%"+"<br>";
		}
	});
	
	var squareColor=squares.style("fill",function(d){
		return choropleth(d,colorScale);
	})
	.on("mouseover",highlight)
	.on("mouseout",dehighlight)
	.on("mousemove",moveLabel)
	.transition() //add animation
	.duration(400)
	.attr("x",function(d,i){
		color=choropleth(d,colorScale);
		//use for loop to arrange each class in order to make the square horizontally contiguous
		for (i=0; i<colorObjectArray.length; i++){
			if (colorObjectArray[i].color==color){
				xValue=colorObjectArray[i].count*(squareWidth+1);
				colorObjectArray[i].count+=1;
			}
			else if (color=="#FFF"){
				xValue=-100000;
			}
		}
		return xValue;
	})
	.attr("y",function(d,i){
		color=choropleth(d,colorScale);
		if (color==appliedColor[0]){
			return 0
		} else if (color==appliedColor[1]){
			return (squareHeight+1);
		} else if (color==appliedColor[2]){
			return (squareHeight+1)*2;
		} else if (color==appliedColor[3]){
			return (squareHeight+1)*3;
		} else if (color==appliedColor[4]){
			return (squareHeight+1)*4;
		} else if (color==appliedColor[5]){
			return (squareHeight+1)*5;
		}
	});
	
	var desc=squares.select("desc")
		.text(function(d){
			return choropleth(d,colorScale)
		});
};

//function to create a dropdown menu for attribute selection
function createDropdown1(csvData){
	//add select element
	var dropdown=d3.select("body")
		.append("div")
		.attr("class","dropdown1")
		.html("<h3>Pick An Option to Explore The Insights:</h3>")
		.append("select")
		.on("change",function(){
			changeAttribute(this.value,csvData)
		});
	/*
	//add initial options
	var titleOption=dropdown.append("option")
		.attr("class","titleOption")
		.attr("disabled","true")
		.text("Select An Attribute to Explore Insights");
	*/
	//add attribute name options
	var attrOptions=dropdown.selectAll("attrOptions")
		.data(attrArray)
		.enter()
		.append("option")
		.attr("value",function(d){return d})
		.text(function(d){return d});
};

//dropdown change listener handler
function changeAttribute(attribute,csvData){
	//change the expressed attribute
	expressed=attribute;
	
	//recreate the color scale
	var colorScale=makeColorScale(csvData);
	
	//recolor enumeration units
	var countries=d3.selectAll(".countries")
		.transition()
		.duration(1000)
		.style("fill",function(d){
			return choropleth(d.properties,colorScale)
		})
		.select("desc")
		.text(function(d){
			return choropleth(d.properties,colorScale)
		});
	//re-sort, resize, and recolor squares
	var squares=d3.selectAll(".square");
	updateChart(squares,csvData.length,colorScale);
	updateInfoPanel(csvData)
};

//function to highlight enumeration units and squares
function highlight(props){
	//change stroke
	var selected=d3.selectAll("."+props.ADM0_A3)
		.style("fill","#FFD700");
		//.style("stroke-width","2");
	setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
	var selection = d3.selectAll("."+props.ADM0_A3);

    var fillColor = selection.select("desc").text();
    selection.style("fill", fillColor); 
	//remove info label
    d3.select(".infolabel")
        .remove(); 
};
	
//function to create dynamic label
function setLabel(props,csvData){
	//label content
	var labelAttribute=props[expressed]+"<b>"+expressed+"</b>";
	
	if (Boolean(props[expressed])==true){
		if (expressed=="Percentage of Female Population"){
			labelAttribute="<strong>"+Math.round(props[expressed])+"% of the population is female"+"</strong>"
		} else if (expressed=="Proportion of National Parliaments Seats Held by Women"){
			labelAttribute="<strong>"+Math.round(props[expressed])+"% of seats are held by women"+"</strong>"
		} else if (expressed=="Life Expectancy at Birth (Female)"){
			labelAttribute="<strong>"+"Estimated life span is "+props[expressed]+" years"+"</strong>"
		} else if (expressed=="Adolescent Fertility Rate"){
			labelAttribute="<strong>"+Math.round(props[expressed])/10+" average number of children per adolescent female</br>"+"</strong>"
		} else if (expressed=="Female Unemployment Rate"){
			labelAttribute="<strong>"+Math.round(props[expressed])+"% of women are unemployed"+"<strong>"
		};
		} else {
			labelAttribute="No Data";
		};
	
	//create info label div
	var infolabel=d3.select("body")
		.append("div")
		.attr("class","infolabel")
		.html(props.ADMIN);
		
	var countryName=infolabel.append("div")
		.attr("class","labelname")
		.attr("id",props.ADM0_A3+"_label")
		.html(labelAttribute);
};

//function to move info label with mouseout
function moveLabel(){
	//get width of label
	var labelWidth=d3.select(".infolabel")
		.node()
		.getBoundingClientRect()
		.width;
	
	//use coordinates of mousemove event to set label coordinates
	var x1=d3.event.clientX+10,
		y1=d3.event.clientY-75,
		x2=d3.event.clientX-labelWidth-10,
		y2=d3.event.clientY+25;
	
	//horizontal label coordinate, testing for overflow
	var x=d3.event.clientX>window.innerWidth-labelWidth-20? x2:x1;
	//vertical label coordinate, testing for overflow
	var y=d3.event.clientY<75? y2:y1;
	
	d3.select(".infolabel")
		.style("left",x+"px")
		.style("top",y+"px");
};

function createInfoPanel(csvData){
	InfoPanelDiv=d3.select("body")
		.append("div")
		.attr("class","InfoPanelDiv")
		
	updateInfoPanel(csvData)
};

function updateInfoPanel(csvData){
	var InfoPanelTitle=InfoPanelDiv
		.html(function(d){
			if (expressed=="Percentage of Female Population"){
				return title_variable1+"<br>";
			} else if (expressed=="Proportion of National Parliaments Seats Held by Women"){
				return title_variable2+"<br>";
			} else if (expressed=="Life Expectancy at Birth (Female)"){
				return title_variable3+"<br>";
			} else if (expressed=="Adolescent Fertility Rate"){
				return title_variable4+"<br>";
			} else if (expressed=="Female Unemployment Rate"){
				return title_variable5+"<br>";
			}
		})
		.attr("class","InfoPanelTitle");
		
	var InfoPanel=InfoPanelDiv.append("text")
		.html(function(d){
			if (expressed=="Percentage of Female Population"){return info_variable1;} 
			if (expressed=="Proportion of National Parliaments Seats Held by Women"){return info_variable2;} 
			if (expressed=="Life Expectancy at Birth (Female)"){return info_variable3;} 
			if (expressed=="Adolescent Fertility Rate"){return info_variable4;} 
			if (expressed=="Female Unemployment Rate"){return info_variable5;}
		})
		.attr("class","InfoPanel");
};

function createIntroPanel(){
	IntroPanelDiv=d3.select("body")
		.append("div")
		.attr("class","IntroPanelDiv")
	$(function(){
		$(".IntroPanelDiv").typed({
			strings: ["The term 'feminism' refers to a range of political, cultural or economic"+"<br>"+"movements aimed at establishing equal rights and legal protection for women."+"<br>"+"The concept 'feminism' has been widely spreaded since 1970s. "+"Recent"+"<br>"+"national or worldwide movements including '<a href='http://www.glamour.com/story/women-of-the-year-black-lives-matter-founders'>Black Lives Matter</a>' and '<a href='https://technical.ly/brooklyn/2017/01/24/womens-march-map-carto-eric-compas/'>Women's"+"<br>"+"March</a>' have all greatly facilitated gender equality across races and societies. "+"<br>"+"However, under Trump's presidency, will these achievements be preserved or"+"<br>"+"challenged? Geographically, how far the World is still from real feminism?"],
			typeSpeed: 0
		});
	});
};

function metaData(){
	var metadata=d3.select("body")
		.append("div")
		.attr("class","metaData")
		.html("<strong>Data Source: </strong><a href='http://data.worldbank.org/indicator'>World Bank </a>"+"<strong>© </strong>Beichen Tian 2017"+"<br>"+"Percentage of Female Population (2015), Proportion of National Parliaments Seats Held by Women (2016),"+"<br>"+"Life Expectancy at Birth (Female) (2014), Adolescent Fertility Rate (2015), Female Unemployment Rate (2014)"+"<br>"+"<strong>Classification Method:</strong> Quantile"+"<br>"+"<strong>Note: </strong>better viewed in 20.8in * 17.7in PC screen FireFox browser.")
}

})();