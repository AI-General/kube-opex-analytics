/*
# File: frontend.js                                                                      #
#                                                                                        #
# Copyright © 2019 Rodrigue Chakode <rodrigue.chakode at gmail dot com>                  #
#                                                                                        #
# This file is part of kube-opex-analytics software authored by Rodrigue Chakode         #
# as part of RealOpInsight Labs (http://realopinsight.com).                              #
#                                                                                        #
# kube-opex-analytics is licensed under the Apache License, Version 2.0 (the "License"); #
# you may not use this file except in compliance with the License. You may obtain        #
# a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0                   #
#                                                                                        #
# Unless required by applicable law or agreed to in writing, software distributed        #
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR            #
# CONDITIONS OF ANY KIND, either express or implied. See the License for the             #
# specific language governing permissions and limitations under the License.             #
*/
'use strict';



var currentUsageType = '';
const DrawingAreaWidth = 0.745 * (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
const DrawingMemScaleUnit = 2e6;
const DrawingMinNodeSide = 128;
const DrawingMaxNodeSide = 512;

requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: './lib/jquery-1.11.0.min',
        bootswatch: './lib/bootswatch',
        bootstrap: './lib/bootstrap.min',
        d3Selection: './d3-selection/dist/d3-selection.min',
        stackedAreaChart: './britecharts/umd/stackedArea.min',
        stackedBarChart: './britecharts/umd/stackedBar.min',
        dotnutChart: './britecharts/umd/donut.min',
        legend: './britecharts/umd/legend.min',
        colors: './britecharts/umd/colors.min',
        tooltip: './britecharts/umd/tooltip.min'
    },
    shim: {
        "bootstrap": ["jquery"],
        "bootswatch": ["jquery", "bootstrap"]
    }
});


define(['jquery', 'bootstrap', 'bootswatch',  'd3Selection', 'stackedAreaChart', 'stackedBarChart', 'dotnutChart', 'legend', 'colors', 'tooltip'], 
    function ($, bootstrap, bootswatch, d3Selection, stackedAreaChart, stackedBarChart, donut, legend, colors, tooltip) {
        let cpuUsageTrendsChart = stackedAreaChart();
        let memoryUsageTrendsChart = stackedAreaChart();
        let dailyCpuUsageChart = stackedBarChart();
        let dailyMemoryUsageChart = stackedBarChart();
        let monthlyCpuUsageChart = stackedBarChart();
        let monthlyMemoryUsageChart = stackedBarChart();

        const truncateText = function(str, length, ending) {
            if (length == null) {
              length = 100;
            }
            if (ending == null) {
              ending = '...';
            }
            if (str.length > length) {
              return str.substring(0, length - ending.length) + ending;
            } else {
              return str;
            }
        };


        function renderLegend(dataset, targetDivContainer, colorSchema) {
            let legendChart = legend();
            let legendContainer = d3Selection.select('.'+targetDivContainer);

            let containerWidth = legendContainer.node() ? legendContainer.node().getBoundingClientRect().width : false;

            if (containerWidth) {
                d3Selection.select('.'+targetDivContainer+' .britechart-legend').remove();
                legendChart
                    .width(containerWidth*0.8)
                    .height(200)
                    .numberFormat('s');

                if (colorSchema) {
                    legendChart.colorSchema(colorSchema);
                }
                legendContainer.datum(dataset).call(legendChart);
                return legendChart;
            }
        }        

        function updateStackedAreaChart(dataset, myStackedAreaChart, targetDivContainer, yLabel, chartTitle, colorSchema) {
            let chartTooltip = tooltip();
            let container = d3Selection.select('.'+targetDivContainer);
            let containerWidth = container.node() ? container.node().getBoundingClientRect().width : false;

            if (containerWidth) {
                myStackedAreaChart
                    .isAnimated(true)
                    .tooltipThreshold(600)
                    .height(400)
                    .margin(5)
                    .grid('full')
                    .xAxisFormat('custom')
                    .xAxisCustomFormat('%a %m/%d %H:%M')
                    .yAxisLabel(yLabel)
                    .width(containerWidth)
                    .dateLabel('dateUTC')
                    .valueLabel('usage')
                    //.colorSchema(colorSchema)
                    .on('customDataEntryClick', function(d, mousePosition) {
                        console.log('Data entry marker clicked', d, mousePosition);
                    })
                    .on('customMouseOver', chartTooltip.show)
                    .on('customMouseMove', function(dataPoint, topicColorMap, dataPointXPosition) {
                        chartTooltip.update(dataPoint, topicColorMap, dataPointXPosition);
                    })
                    .on('customMouseOut', chartTooltip.hide);

                if (colorSchema) {
                    myStackedAreaChart.colorSchema(colorSchema);
                }

                container.datum(dataset.data).call(myStackedAreaChart);

                chartTooltip
                    .topicLabel('values')
                    .title(chartTitle);

                let tooltipContainer = d3Selection.select('.'+targetDivContainer+' .metadata-group .vertical-marker-container');
                tooltipContainer.datum([]).call(chartTooltip);

                d3Selection.select('#button').on('click', function() {
                    myStackedAreaChart.exportChart('stacked-area.png', chartTitle);
                });
            }
        }


        function updateStackedBarChart(dataset, myStackedBarChart, targetDivContainer, yLabel, chartTitle, colorSchema) {
            let chartTooltip = tooltip();
            let container = d3Selection.select('.'+targetDivContainer);
            let containerWidth = container.node() ? container.node().getBoundingClientRect().width : false;
            
            if (containerWidth) {
                myStackedBarChart
                    .tooltipThreshold(400)
                    .height(400)
                    .width(containerWidth)
                    .grid('horizontal')
                    .isAnimated(true)
                    .stackLabel('stack')
                    .nameLabel('date')
                    .valueLabel('usage')
                    .nameLabelFormat('%Y-%m-%d')
                    .betweenBarsPadding(0.2)
                    .yAxisLabel(yLabel)
                    //.colorSchema(colorSchema)
                    // .margin(5)
                    // .margin({left: 50, top: 0, right: 0, bottom: 20})
                    .on('customMouseOver', function(data) {
                        chartTooltip.show();
                    })
                    .on('customMouseOut', function() {
                        chartTooltip.hide();
                    })                   
                    .on('customMouseMove', function(dataPoint, topicColorMap, pos) {
                        chartTooltip.update(dataPoint, topicColorMap, pos);
                    });

                container.datum(dataset.data).call(myStackedBarChart);

                chartTooltip
                    .nameLabel('stack')
                    .topicLabel('values')
                    .title(chartTitle);

                let tooltipContainer = d3Selection.select('.'+targetDivContainer+' .metadata-group');
                tooltipContainer.datum([]).call(chartTooltip);                

                d3Selection.select('#button').on('click', function() {
                    stackedBar.exportChart('stacked-bar.png', chartTitle);
                });
            }
        }


        function updateDonutChart(dataset, myDonutChart, targetDivContainer, legendContainer, chartTitle, colorSchema) {
            let legendChart = renderLegend(dataset, legendContainer, colorSchema);
            let donutContainer = d3Selection.select('.'+targetDivContainer);
            let containerWidth = donutContainer.node() ? donutContainer.node().getBoundingClientRect().width : false;

            if (containerWidth) {
                d3Selection.select('#button').on('click', function() {
                    myDonutChart.exportChart();
                });

                myDonutChart
                    .isAnimated(true)
                    .highlightSliceById(2)
                    .width(containerWidth)
                    .height(containerWidth)
                    .externalRadius(containerWidth/2.5)
                    .internalRadius(containerWidth/5)
                    .on('customMouseOver', function(data) {
                        legendChart.highlight(data.data.id);
                    })
                    .on('customMouseOut', function() {
                        legendChart.clearHighlight();
                    });

                if (colorSchema) {
                    myDonutChart.colorSchema(colorSchema);
                }

                donutContainer.datum(dataset).call(myDonutChart);

                d3Selection.select('#button').on('click', function() {
                    myDonutChart.exportChart('donut.png', chartTitle);
                });
            }
        }


        function generateTooltip(node)
        {
            let tooltip = '<table class="table table-striped"><tbody>';

            tooltip += '<tr><td>Host</td><td>'+node.name+'</td></tr>';
            tooltip += '<tr><td>UID</td><td>'+node.id+'</td></tr>';
            tooltip += '<tr><td>Container Runtime</td><td>'+node.containerRuntime+'</td></tr>';
            tooltip += '<tr><td>State</td><td>'+node.state+'</td></tr>';
            tooltip += '<tr><td>CPU</td><td>'+node.cpuCapacity+'</td></tr>';
            tooltip += '<tr><td>&nbsp;&nbsp;Allocatable</td><td>'+computeLoad(node.cpuAllocatable, node.cpuCapacity)+'</td></tr>';
            tooltip += '<tr><td>&nbsp;&nbsp;Usage</td><td>'+computeLoad(node.cpuUsage, node.cpuCapacity)+'</td></tr>';
            tooltip += '<tr><td>Memory</td><td>'+node.memCapacity+'</td></tr>';
            tooltip += '<tr><td>&nbsp;&nbsp;Allocatable</td><td>'+computeLoad(node.memAllocatable, node.memAllocatable)+'</td></tr>';
            tooltip += '<tr><td>&nbsp;&nbsp;Usage</td><td>'+computeLoad(node.memUsage, node.memCapacity)+'</td></tr>';
            tooltip += '<tr><td>Pods Running</td><td>'+node.podsRunning.length+'</td></tr>';
        
            tooltip += '</tbody></table>';
            return tooltip;
        }

        function createPopupContent(nodeInfo)
        {
            return ('<div class="modal fade" id="'+nodeInfo.id+'" tabindex="-1" role="dialog" aria-labelledby="'+nodeInfo.name+'" aria-hidden="true">'
                +'<div class="modal-dialog">'
                +'<div class="modal-content">'
                +'<div class="modal-header">'
                +'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
                +'<h4 class="modal-title" id="'+nodeInfo.name+'">'+nodeInfo.name+'</h4>'
                +'</div>'
                +'<div class="modal-body">'
                +generateTooltip(nodeInfo)
                +'</div>'
                +'<div class="modal-footer">'
                +'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
                +'</div>'
                +'</div>'
                +'</div>'
                +'</div>');
        }


        function buildNodesLoadDataSet(data, usageType)
        {
            let dataset = { "data": new Map() };

            let nodeHtmlList = '';
            let popupContent = '';
            for (let nname in data) {
                if (data.hasOwnProperty(nname)) {
                    let node = data[nname];
                    nodeHtmlList += '<li><a href="#" data-toggle="modal" data-target="#'+node.id+'">'+ node.name+'</a></li>';
                    popupContent += createPopupContent(node);
                }
            }
            $("#host-list-container").html('<ul>'+nodeHtmlList+"</ul>");
            $("#popup-container").html(popupContent);

            for (let nname in data) {
                if (! data.hasOwnProperty(nname)) {
                    continue;
                }
                let resUsage = '';
                let resCapacity = '';

                switch (usageType) {
                    case UsageTypes.MEM:
                        resUsage = 'memUsage';
                        resCapacity = 'memCapacity';
                        break;
                    case UsageTypes.CPU:
                        resUsage = 'cpuUsage';
                        resCapacity = 'cpuCapacity';
                        break;               
                    default:
                        $("#error-message").html('unknown load type: '+ usageType);
                        $("#error-message-container").show();
                        return;
                }

                let node = data[nname];
                if (typeof node[resUsage] === "undefined" || node[resUsage] == 0) {
                    $("#error-message").html('No '+resUsage+' metric on node: ' + node.name +'\n');
                    $("#error-message-container").show();
                    continue;
                }

                if (node[resUsage] == 0) {
                    $("#error-message").html('ignoring node '+node.name+' with '+resUsage+' equals to zero ');
                    $("#error-message-container").show();
                    continue;
                }

                // sort pods in ascending order in against resource usage
                node.podsRunning.sort(
                    function(p1, p2) {
                        if (p1[resUsage] < p2[resUsage])
                            return -1;
                        if (p1[resUsage] > p2[resUsage])
                            return 1;
                        return 0;
                    }
                );

                let chartData = [];
                let sumLoad = 0.0;
                let loadColors = [];
                for (let pid = 0; pid < node.podsRunning.length; pid++) {
                    let pod = node.podsRunning[pid];
                    let podLoad = computeLoad(pod[resUsage], node[resCapacity]);
                    let podLoadRel = computeLoad(pod[resUsage], node[resUsage]);
                    loadColors.push(computeLoadHeatMapColor(podLoadRel));
                    sumLoad += podLoad;
                    if (pod[resUsage] > 0.0 ) {
                        chartData.push({
                            "name": truncateText(pod.name, 25, '...'),
                            "id": pid,
                            "quantity": pod[resUsage],
                            "percentage": podLoad
                        });
                    }
                }
                chartData.push({
                    "name": 'unused',
                    "id": 9999,
                    "quantity": node[resCapacity] - (node[resCapacity] * sumLoad/100),
                    "percentage": (100 - sumLoad)
                });
                loadColors.push(computeLoadHeatMapColor(0));
                dataset.data.set(nname, {'chartData': chartData, 'colorSchema': loadColors})
            }
            return dataset;
        }


        function computeLoad(used, capacity)
        {
            return Math.ceil(1e4*used/capacity ) / 100
        }

        function  computeLoadHeatMapColor(load) {
            const NUM_COLORS = 4;
            const HeatMapColors = Object.freeze({
                '0': [0,0,255],
                '1': [0,255,0],
                '2': [255,255,0],
                '3': [255,0,0]
            });

            let colorLevel = load / 100;
            let idx1 = 0;
            let idx2 = 0;
            let fractBetween = 0;
            if (colorLevel <= 0) {
                idx1 = idx2 = 0;
            } else if (colorLevel >= 1)  {
                idx1 = idx2 = NUM_COLORS - 1;
            } else {
                let tmpValue = colorLevel * (NUM_COLORS - 1);
                idx1  = Math.floor(tmpValue);
                idx2  = idx1+1;
                fractBetween = tmpValue - idx1;
            }

            let r = (HeatMapColors[idx2][0] - HeatMapColors[idx1][0])*fractBetween + HeatMapColors[idx1][0];
            let g = (HeatMapColors[idx2][1] - HeatMapColors[idx1][1])*fractBetween + HeatMapColors[idx1][1];
            let b = (HeatMapColors[idx2][2] - HeatMapColors[idx1][2])*fractBetween + HeatMapColors[idx1][2];
            return 'rgb('+r+','+g+',' +b+')';
        }


        function updateNodeUsage(frontendDataDir)
        {
            currentUsageType = $("#node-usage-type option:selected" ).val();
            $.ajax({
                type: "GET",
                url: frontendDataDir+'/nodes.json',
                dataType: "json",
                success: function(data) {
                    let dataset = buildNodesLoadDataSet(data, currentUsageType, 'donut');
                    let dynHtml = '';
                    let donuts = new Map();
                    for (let [nname, _] of dataset.data) {
                        donuts[nname] = donut();
                        dynHtml += '<div class="col-md-4">';
                        dynHtml += '  <h4>'+nname+'</h4>';
                        dynHtml += '  <div class="js-'+nname+'"></div>';
                        dynHtml += '  <div class="js-'+nname+'-legend" britechart-legend"></div>';
                        dynHtml += '</div>';
                    }
                    $("#js-nodes-load-container").html(dynHtml);
                    for (let [nname, ndata] of dataset.data) {
                        updateDonutChart(ndata['chartData'],
                            donuts[nname],
                            'js-'+nname,
                            'js-'+nname+'-legend', 
                            colors.colorSchemas.orange);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });            
        }

        function triggerRefreshUsageCharts(frontendDataDir)
        {
            console.log(Date(), 'updating usage...')
            $("#error-message-container").hide();

            $.ajax({
                type: "GET",
                url: frontendDataDir+'/cpu_usage_trends.json',
                dataType: "json",
                success: function(data) {
                    updateStackedAreaChart(
                        {"data": data},
                        cpuUsageTrendsChart,
                        'js-usage-cpu-trends',
                        'usage ratio (%)',
                        'Namespace hourly usage');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });

            $.ajax({
                type: "GET",
                url: frontendDataDir+'/memory_usage_trends.json',
                dataType: "json",
                success: function(data) {
                    updateStackedAreaChart(
                        {"data": data},
                        memoryUsageTrendsChart,
                        'js-usage-memory-trends',
                        'usage ratio (%)',
                        'Namespace hourly usage');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });            

            $.ajax({
                type: "GET",
                url: frontendDataDir+'/cpu_usage_period_1209600.json',
                dataType: "json",
                success: function(data) {
                    updateStackedBarChart(
                        {"data": data},
                        dailyCpuUsageChart,
                        'js-daily-cpu-usage',
                        'usage ratio (%)',
                        'Daily CPU Usage', 
                        colors.colorSchemas.orange);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });


            $.ajax({
                type: "GET",
                url: frontendDataDir+'/memory_usage_period_1209600.json',
                dataType: "json",
                success: function(data) {
                    updateStackedBarChart(
                        {"data": data},
                        dailyMemoryUsageChart,
                        'js-daily-memory-usage',
                        'usage ratio (%)',
                        'Daily Memory Usage', 
                        colors.colorSchemas.orange);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });            

            $.ajax({
                type: "GET",
                url: frontendDataDir+'/cpu_usage_period_31968000.json',
                dataType: "json",
                success: function(data) {
                    updateStackedBarChart(
                         {"data": data},
                         monthlyCpuUsageChart,
                        'js-montly-cpu-usage',
                        'usage ratio (%)',
                        'Monthly CPU Usage');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });       
            
            $.ajax({
                type: "GET",
                url: frontendDataDir+'/memory_usage_period_31968000.json',
                dataType: "json",
                success: function(data) {
                    updateStackedBarChart(
                         {"data": data},
                         monthlyMemoryUsageChart,
                        'js-montly-memory-usage',
                        'usage ratio (%)',
                        'Monthly Memory Usage');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $("#error-message").html('error ' + xhr.status + ' (' + thrownError +')');
                    $("#error-message-container").show();
                }
            });                   

            // update nodes usage
            updateNodeUsage(frontendDataDir);
            console.log(Date(), 'updating completed')
        }

        (function($)
        {
            $(document).ready(function()
            {
                $.ajaxSetup(
                    {
                        cache: false,
                        beforeSend: function() {
                            $('#js-node-load-container').hide();
                        },
                        complete: function() {
                            $('#js-node-load-container').show();
                        },
                        success: function() {
                            $('#js-node-load-container').show();
                        }
                    });
                triggerRefreshUsageCharts(frontendDataDir, UsageTypes.CPU);
                setInterval(function() {triggerRefreshUsageCharts(frontendDataDir);}, 300000); // update every 5 mins
            });
        })(jQuery);

        // export API
        FrontendApi.refreshUsageCharts =  triggerRefreshUsageCharts;
        FrontendApi.updateNodeUsage =  updateNodeUsage;
    }
);