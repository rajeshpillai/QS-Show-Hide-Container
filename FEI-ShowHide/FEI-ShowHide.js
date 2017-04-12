define(['js/qlik', './properties'], function (qlik, properties) {
    var obj =  {
        initialProperties: {conditionalVis: [], defaultMasterObject: ''},
        support : {
            exportData: true,
            snapshot: true
        },
        definition: properties,
        template: '<div style="display:block;  width:100%; height:100%; overflow:visible;"></div>',
        controller: function ($scope, $element) {
            // Make sure the selections bar can overlay the extension's boundaries
            $(".qv-object .qv-inner-object").css('overflow','visible');

            // On initial load, get the active visualization ID we should display and initialize the current chart object
            $scope.app = qlik.currApp();
            obj.app = qlik.currApp();  //todo: RP
            $scope.currentChart = getActiveVisID($scope.component.model.layout.conditionalVis);
            $scope.currentChartModel = null;



            $scope.export = function(model) {
                var exportOpts = {
                    //format: $scope.layout.props.exportFormat,
                    //state: $scope.layout.props.exportState,
                    filename: 'e:/temp/', //$scope.layout.props.exportFileName,
                    download: true
                };

                // if ( qlik.table ) {
                //     var qTable = qlik.table( this );
                //     qTable.exportData( exportOpts, function( result ) {
                //         console.log( result );
                //     } ); //Todo: this will open the link using window.open, so popup-blockers might catch that
                // } else {
                //     //console.log('this', this.$parent.$parent.$parent.model);
                //     //this.$parent.$parent.$parent.model.session("ExportData",null, exportOpts.format, null, exportOpts.fileName, exportOpts.state);
                // }

                // model.exportData(exportOpts).then(function( reply ) {
                //     console.log('qUrl', reply);
                //     //window.open(reply.result.qUrl);
                //  });

                var table = new qlik.table(model);
                table.exportData(exportOpts, function (reply) {
                    console.log("EXPORT REPLY: ", reply);
                    alert('EXPORT');
                });


            }

            // If we do have a chart ID, render the object.
            if($scope.currentChart) {
                renderChart();
            };

            // When data has been updated on the server
            $scope.component.model.Validated.bind(function() {
                // Make sure the selections bar can overlay the extension's boundaries
                $(".qv-object .qv-inner-object").css('overflow','visible');

                // Get the active visualization ID after the data is updated
                var chart = getActiveVisID($scope.component.model.layout.conditionalVis);

                console.info('chart:', chart);  //todo:RP
                console.info(JSON.stringify(chart));

                $scope.app.visualization.get(chart).then(function(vis){
                    //vis.show("QV01");
                    console.info("Found chart with ID: ", chart);
                    console.info('Viz: ', vis);
                    obj.chartId = chart;
                });

                // If we do have a chart ID and it's a different one than the currentChart, update the currentChart and then render the new object
                if(chart && chart !== $scope.currentChart) {
                    $scope.currentChart = chart;
                    renderChart();
                }
                /* Else if we do not have a chart ID, check if this is the first time we don't have a chart ID. If it is, destroy the current chart object first. If it's not the first time, we can safely assume there aren't any leftover unused objects.*/
                else if(!chart && chart !== $scope.currentChart){
                    if ($scope.currentChartModel){
                        $scope.currentChart = null;
                        destroyObject();
                    }
                }
                else if(!chart && chart === $scope.currentChart){
                    $scope.currentChartModel = null;
                }
            });


            /* If only one condition results in 1,
                return its visualization ID.
                Else if default exists, return the default visualization ID,
                otherwise return null
            */
            function getActiveVisID(conditionalVisList) {
                var conditionResults = conditionalVisList.map(function(visObject) {
                    return +visObject.condition
                });

                var sumOfResults = conditionResults.reduce(function(a, b) {return a + b;}, 0);
                var activeChart = null;
                if(sumOfResults==1){
                    if(conditionalVisList[conditionResults.indexOf(1)].conditionalMasterObject){
                        activeChart = conditionalVisList[conditionResults.indexOf(1)].conditionalMasterObject.split('|')[1]
                    }
                    else{activeChart = null}
                }
                else if($scope.component.model.layout.defaultMasterObject){activeChart = $scope.component.model.layout.defaultMasterObject.split('|')[1]}
                else{activeChart = null}

                console.log('Condition Results:',conditionResults);
                console.log('Active Chart is: ', activeChart);

                return activeChart;
            };

            /* If there is no current chart object (on initialization or a null chart ID),
                 do the getObject and assign it to our template div.
               Else if there is a current chart object,
                destroy it first, then do the getObject and assign it to our template div. */
            function renderChart() {

                if($scope.currentChartModel==null) {
                    $scope.app.getObject($element.find('div'), $scope.currentChart).then(function(model) {
                        $scope.currentChartModel = model;

                        console.log("EXPORTING:TODO:RP1");
                        console.log(model);
                        //$scope.export(model);
                    });
                }
                else {
                    $scope.currentChartModel.enigmaModel.endSelections(true)
                        .then(destroyObject)
                        .then(
                        function() {
                            $scope.app.getObject($element.find('div'), $scope.currentChart)
                                .then(function(model) {
                                $scope.currentChartModel = model;

                                console.log("EXPORTING:TODO:RP2");
                                console.log(model);
                                //console.dir(model.layout.qHyperCube);
                                //$scope.export(model);
                            });
                        });
                }

                //todo:RP
                obj.activeModel = $scope.currentChartModel;
            };

            //Destroy any leftover models to avoid memory leaks of unused objects
            function destroyObject() {
                return $scope.app.destroySessionObject($scope.currentChartModel.layout.qInfo.qId)
                    .then(function() {return $scope.currentChartModel.close();})
                    .then(function() {$scope.currentChartModel = null;});
            };

            function delay(ms){
                var ctr, rej, p = new Promise(function (resolve, reject) {
                    ctr = setTimeout(resolve, ms);
                    rej = reject;
                });
                p.cancel = function(){ clearTimeout(ctr); rej(Error("Cancelled"))};
                return p;
            };




        },
        paint: function ($element, $layout) {
            return qlik.Promise.resolve();
        },
        resize: function () {
            return false; // We do not need to handle resizes in this extension as the charts will resize themselves.
        },

        //todo:RP
        getExportRawDataOptions: function (a, c, e) {
            var self = this;
            console.log("c: ", c);
            obj.c = c;
            return a.addItem({
                        translation: "contextMenu.export",
                        tid: "export",
                        icon: "icon-toolbar-sharelist",
                        select: function () {

                            console.log('About to export...', obj.c.model);
                            obj.export(obj.c.model);

                            //$('#cl-customreport-container').scope().exportData('exportToExcel');
                        }
                    }), void e.resolve();
        },
        export: function(model) {

                console.log("EXPORT BEGIN...", model);
                var exportOpts = {
                    //format: $scope.layout.props.exportFormat,
                    //state: $scope.layout.props.exportState,
                    filename: 'zs-export.xlsx', //$scope.layout.props.exportFileName,
                    download: true
                };

                // var table = new qlik.table(model);
                // table.exportData(exportOpts, function (reply) {
                //     console.log("EXPORT REPLY: ", reply);
                //     alert('EXPORT');
                // });
                obj.app.visualization.get(obj.chartId).then(function(vis){
                    vis.table.exportData(exportOpts).then(function (reply) {
                       console.log("EXPORT REPLY: ", reply);
                    });
                });
            }
    }

    return obj;
});
