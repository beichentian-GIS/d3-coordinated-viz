//begin script when window loads
window.onload=setMap();

//set up choropleth map
function setMap(){
	
	//map frame dimensions
	var width=1060,
		height=560;
		
	//create new svg container for the map
	var map=d3.select("body")
		.append("svg")
		.attr("class","map")
		.attr("width",width)
		.attr("height",height);
		
	//create Robinson projection 
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
		
		//translate world countries TopoJSON
		var worldCountries=topojson.feature(world,world.objects.WorldCountries).features;
		
		//add world countries to map
		var countries=map.selectAll(".countries")
			.data(worldCountries)
			.enter()
			.append("path")
			.attr("class",function(d){
				return "countries"+d.properties.ADM0_A3;
			})
			.attr("d",path);
	};
};