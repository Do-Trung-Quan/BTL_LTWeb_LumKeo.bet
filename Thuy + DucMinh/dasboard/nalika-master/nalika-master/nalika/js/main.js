(function ($) {
 "use strict";

	/*----------------------------
	 jQuery MeanMenu
	------------------------------ */
	jQuery('nav#dropdown').meanmenu();	
	/*----------------------------
	 jQuery myTab
	------------------------------ */
	$('#myTab a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});
		$('#myTab3 a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});
		$('#myTab4 a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});

	  $('#single-product-tab a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});
	
	$('[data-toggle="tooltip"]').tooltip(); 
	
	$('#sidebarCollapse').on('click', function () {
                     $('#sidebar').toggleClass('active');
                     
                 });
		// Collapse ibox function
			$('#sidebar ul li').on('click', function () {
				var button = $(this).find('i.fa.indicator-mn');
				button.toggleClass('fa-plus').toggleClass('fa-minus');
				
			});
	/*-----------------------------
			Menu Stick
		---------------------------------*/
		$(".sicker-menu").sticky({topSpacing:0});
			
		$('#sidebarCollapse').on('click', function () {
			$("body").toggleClass("mini-navbar");
			SmoothlyMenu();
		});
		$(document).on('click', '.header-right-menu .dropdown-menu', function (e) {
			  e.stopPropagation();
			});
 
	
/*----------------------------
 wow js active
------------------------------ */
 new WOW().init();
 
/*----------------------------
 owl active
------------------------------ */  
  $("#owl-demo").owlCarousel({
      autoPlay: false, 
	  slideSpeed:2000,
	  pagination:false,
	  navigation:true,	  
      items : 4,
	  /* transitionStyle : "fade", */    /* [This code for animation ] */
	  navigationText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
      itemsDesktop : [1199,4],
	  itemsDesktopSmall : [980,3],
	  itemsTablet: [768,2],
	  itemsMobile : [479,1],
  });

/*----------------------------
 price-slider active
------------------------------ */  
	  $( "#slider-range" ).slider({
	   range: true,
	   min: 40,
	   max: 600,
	   values: [ 60, 570 ],
	   slide: function( event, ui ) {
		$( "#amount" ).val( "£" + ui.values[ 0 ] + " - £" + ui.values[ 1 ] );
	   }
	  });
	  $( "#amount" ).val( "£" + $( "#slider-range" ).slider( "values", 0 ) +
	   " - £" + $( "#slider-range" ).slider( "values", 1 ) );  
	   
/*--------------------------
 scrollUp
---------------------------- */	
	$.scrollUp({
        scrollText: '<i class="fa fa-angle-up"></i>',
        easingType: 'linear',
        scrollSpeed: 900,
        animation: 'fade'
    }); 	   
 
})(jQuery); 



$(document).ready(function() {
    // Initialize chart with "Today" data as default
    var currentView = "today";
    createChart(currentView);
    
    // Handle toggle buttons
    $("#option1").on("change", function() {
        if ($(this).is(":checked")) {
            currentView = "today";
            $("#curved-line-chart").empty();
            createChart(currentView);
        }
    });
    
    $("#option2").on("change", function() {
        if ($(this).is(":checked")) {
            currentView = "week";
            $("#curved-line-chart").empty();
            createChart(currentView);
        }
    });
    
    // Function to create chart based on selected view
    function createChart(viewType) {
        var data, options;
        
        if (viewType === "today") {
            // Today view - 12 data points (24 hours with 2-hour intervals)
            data = [{ 
                label: "Website Visits", 
                data: [
                    [0, randomVisits()], [1, randomVisits()], [2, randomVisits()], 
                    [3, randomVisits()], [4, randomVisits()], [5, randomVisits()],
                    [6, randomVisits()], [7, randomVisits()], [8, randomVisits()],
                    [9, randomVisits()], [10, randomVisits()], [11, randomVisits()]
                ] 
            }];
            
            options = getChartOptions([
                [0, "12 AM"], [1, "2 AM"], [2, "4 AM"], [3, "6 AM"], 
                [4, "8 AM"], [5, "10 AM"], [6, "12 PM"], [7, "2 PM"], 
                [8, "4 PM"], [9, "6 PM"], [10, "8 PM"], [11, "10 PM"]
            ]);
        } else {
            // Week view - 7 data points (one for each day)
            data = [{ 
                label: "Website Visits", 
                data: [
                    [0, randomVisits()], [1, randomVisits()], [2, randomVisits()], 
                    [3, randomVisits()], [4, randomVisits()], [5, randomVisits()],
                    [6, randomVisits()]
                ] 
            }];
            
            options = getChartOptions([
                [0, "Monday"], [1, "Tuesday"], [2, "Wednesday"], [3, "Thursday"], 
                [4, "Friday"], [5, "Saturday"], [6, "Sunday"]
            ]);
        }
        
        $.plot($("#curved-line-chart"), data, options);
    }
    
    // Generate random number for visits (between 500 and 2500)
    function randomVisits() {
        return Math.floor(Math.random() * 2000) + 500;
    }
    
    // Get chart options based on the ticks
    function getChartOptions(ticks) {
        return {
            series: {
                lines: {
                    show: true,
                    lineWidth: 2,
                    fill: true,
                    fillColor: {
                        colors: [{ opacity: 0.2 }, { opacity: 0.1 }]
                    }
                },
                points: {
                    show: true,
                    radius: 3,
                    fill: true
                }
            },
            grid: {
                borderWidth: 0,
                labelMargin: 10,
                hoverable: true,
                clickable: true,
                backgroundColor: "transparent"
            },
            xaxis: {
                ticks: ticks,
                tickDecimals: 0
            },
            yaxis: {
                tickSize: 500,
                min: 0,
                max: 3000
            },
            colors: ["#00c292"],
            tooltip: true,
            tooltipOpts: {
                content: "%y visits at %x",
                defaultTheme: false
            }
        };
    }
});
