(function () {

    angular
        .module('BackofficeApp')
        .directive('onReadFile', function ($parse) {

          	return {
          		restrict: 'A',
          		scope: false,
          		link: function(scope, element, attrs) {
                      var fn = $parse(attrs.onReadFile);

          			element.on('change', function(onChangeEvent) {
        				    var reader = new FileReader();
            				reader.onload = function(onLoadEvent) {
              					scope.$apply(function() {
                            var data = onLoadEvent.target.result;
                            var workbook = XLSX.read(data, {
                              type: 'binary'
                            });

                            workbook.SheetNames.forEach(function(sheetName) {
                                if (workbook.Sheets[sheetName].hasOwnProperty('!ref')) {
                                  var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                                  var chartset = jschardet.detect(csv);

                                    if (chartset.encoding == 'UTF-8') {
                                      fn(scope, {$fileContent:decodeURIComponent(escape(csv))});
                                    }else {
                                      fn(scope, {$fileContent:csv});
                                    }
                                }
                            });
              					});
            				};

                    reader.readAsBinaryString((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                    onChangeEvent.srcElement.value = null;
          			});
          		}
          	};
          })
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$stateParams', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'TableHelperService',
            'AssetService', 'ThreatService', 'VulnService', 'AmvService', 'MeasureService', 'TagService', 'RiskService', 'ObjlibService', '$state',
            '$timeout', '$http', 'DownloadService', '$rootScope', 'SOACategoryService', 'ReferentialService', 'MeasureMeasureService', 'UserService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $stateParams, toastr, $mdMedia, $mdDialog, gettextCatalog, TableHelperService,
                                  AssetService, ThreatService, VulnService, AmvService, MeasureService, TagService, RiskService, ObjlibService,
                                  $state, $timeout, $http, DownloadService, $rootScope, SOACategoryService, ReferentialService,
                                  MeasureMeasureService, UserService) {

        $scope.tab = $stateParams.tab;
        $scope.gettext = gettextCatalog.getString;
        TableHelperService.resetBookmarks();

        /*
         * Global helpers
         */

        $scope.specificityStr = function (type) {
            switch (type) {
                case 0: return gettextCatalog.getString('Generic');
                case 1: return gettextCatalog.getString('Specific');
            }
        };

        $scope.selectTab = function (tab) {
            switch (tab) {
                case 'assets': $scope.currentTabIndex = 0; break;
                case 'threats': $scope.currentTabIndex = 1; break;
                case 'vulns': $scope.currentTabIndex = 2; break;
                case 'measures': $scope.currentTabIndex = 3; break;
                case 'categories': $scope.currentTabIndex = 4; break;
                case 'amvs': $scope.currentTabIndex = 5; break;
                case 'objlibs': $scope.currentTabIndex = 6; break;
            }
        }
        $scope.selectTab($scope.tab);

        $scope.$on('$locationChangeSuccess', function (event, newUrl) {
            var tabName = newUrl.substring(newUrl.lastIndexOf('/') + 1);
            $scope.tab = tabName;
            $scope.selectTab(tabName);
        });

        $scope.userLanguage = UserService.getUiLanguage();

        /*
         * ASSETS TYPE TAB
         */
        $scope.assets = TableHelperService.build('label' + $scope.userLanguage, 20, 1, '');
        $scope.assets.activeFilter = 1;
        var assetsFilterWatch;

        $scope.selectAssetsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'assets'});
            var initAssetsFilter = true;
            assetsFilterWatch = $scope.$watch('assets.activeFilter', function() {
                if (initAssetsFilter) {
                    initAssetsFilter = false;
                } else {
                    $scope.assets.query.page = 1;
                    $scope.updateAssets();
                }
            });
            TableHelperService.watchSearch($scope, 'assets.query.filter', $scope.assets.query, $scope.updateAssets, $scope.assets);
        };

        $scope.deselectAssetsTab = function () {
            assetsFilterWatch();
            TableHelperService.unwatchSearch($scope.assets);
            $scope.assets.selected = [];
        };

        $scope.updateAssets = function () {
            var query = angular.copy($scope.assets.query);
            query.status = $scope.assets.activeFilter;

            if ($scope.assets.previousQueryOrder != $scope.assets.query.order) {
                $scope.assets.query.page = query.page = 1;
                $scope.assets.previousQueryOrder = $scope.assets.query.order;
            }

            $scope.assets.promise = AssetService.getAssets(query);
            $scope.assets.promise.then(
                function (data) {
                    $scope.assets.items = data;
                }
            )
        };

        $scope.removeAssetsFilter = function () {
            TableHelperService.removeFilter($scope.assets);
        };

        $scope.toggleAssetStatus = function (asset) {
            AssetService.patchAsset(asset.id, {status: !asset.status}, function () {
                asset.status = !asset.status;
            });
        };

        $scope.createNewAsset = function (ev, asset) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'asset', CreateAssetDialogCtrl],
                templateUrl: 'views/anr/create.assets.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'asset': asset
                }
            })
                .then(function (asset) {
                    var cont = asset.cont;
                    asset.cont = undefined;

                    AssetService.createAsset(asset,
                        function () {
                            $scope.updateAssets();

                            if (cont) {
                                $scope.createNewAsset(ev);
                            }

                            if (asset.mode == 0 && asset.models && asset.models.length > 0) {
                                // If we create a generic asset, but we still have specific models, we should warn
                                toastr.warning(gettextCatalog.getString('The asset type has been created successfully, however without models, the element may not be specific.',
                                    {assetLabel: $scope._langField(asset,'label')}));
                            } else {
                                toastr.success(gettextCatalog.getString('The asset type has been created successfully.',
                                    {assetLabel: $scope._langField(asset,'label')}), gettextCatalog.getString('Creation successful'));
                            }
                        },

                        function () {
                            $scope.createNewAsset(ev, asset);
                        }
                    );
                });
        };

        $scope.editAsset = function (ev, asset) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $scope.controls = [];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
            AssetService.getAsset(asset.id).then(function (assetData) {
                $scope.controls = [{}];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'asset', CreateAssetDialogCtrl],
                    templateUrl: 'views/anr/create.assets.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'asset': assetData
                    }
                })
                    .then(function (asset) {
                        AssetService.updateAsset(asset,
                            function () {
                                $scope.updateAssets();

                                if (asset.mode == 0 && asset.models && asset.models.length > 0) {
                                    // If we create a generic asset, but we still have specific models, we should warn
                                    toastr.warning(gettextCatalog.getString('The asset type has been edited successfully, however without models, the element may not be specific.',
                                        {assetLabel: $scope._langField(asset,'label')}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The asset type has been edited successfully.',
                                        {assetLabel: $scope._langField(asset,'label')}), gettextCatalog.getString('Edition successful'));
                                }
                            },

                            function () {
                                $scope.editAsset(ev, asset);
                            }
                        );
                    });
            });
        };

        $scope.deleteAsset = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete asset type?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AssetService.deleteAsset(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The asset type has been deleted.',
                                    {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateAssets();
                        $scope.assets.selected = $scope.assets.selected.filter(assetSelected => assetSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteAssetMass = function (ev, item) {
            var count = $scope.assets.selected.length;
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset type(s)?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.assets.selected.length; ++i) {
                    ids.push($scope.assets.selected[i].id);
                }

                AssetService.deleteMassAsset(ids, function () {
                    toastr.success(gettextCatalog.getString('{{count}} assets type have been deleted.',
                        {count: count}), gettextCatalog.getString('Deletion successful'));
                    $scope.updateAssets();
                });

                $scope.assets.selected = [];

            });
        };

        $scope.assetTypeStr = function (type) {
            switch (type) {
                case 1: return gettextCatalog.getString('Primary');
                case 2: return gettextCatalog.getString('Secondary');
            }
        };

        /*
         * THREATS TAB
         */
        $scope.threats = TableHelperService.build('label' + $scope.userLanguage, 20, 1, '');
        $scope.threats.activeFilter = 1;
        var threatsFilterWatch;

        $scope.selectThreatsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'threats'});
            var initThreatsFilter = true;
            threatsFilterWatch = $scope.$watch('threats.activeFilter', function() {
                if (initThreatsFilter) {
                    initThreatsFilter = false;
                } else {
                    $scope.updateThreats();
                }
            });
            TableHelperService.watchSearch($scope, 'threats.query.filter', $scope.threats.query, $scope.updateThreats, $scope.threats);
        };

        $scope.deselectThreatsTab = function () {
            threatsFilterWatch();
            TableHelperService.unwatchSearch($scope.threats);
            $scope.threats.selected = [];
        };

        $scope.updateThreats = function () {
            var query = angular.copy($scope.threats.query);
            query.status = $scope.threats.activeFilter;

            if ($scope.threats.previousQueryOrder != $scope.threats.query.order) {
                $scope.threats.query.page = query.page = 1;
                $scope.threats.previousQueryOrder = $scope.threats.query.order;
            }

            $scope.threats.promise = ThreatService.getThreats(query);
            $scope.threats.promise.then(
                function (data) {
                    $scope.threats.items = data;
                }
            )
        };
        $scope.removeThreatsFilter = function () {
            TableHelperService.removeFilter($scope.threats);
        };


        $scope.toggleThreatStatus = function (threat) {
            ThreatService.patchThreat(threat.id, {status: !threat.status}, function () {
                threat.status = !threat.status;
            });
        };

        $scope.createNewThreat = function (ev, threat) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'toastr', '$mdMedia',  '$mdDialog', 'gettextCatalog', '$q', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
                templateUrl: 'views/anr/create.threats.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'threat': threat
                }
            })
                .then(function (threat) {
                    var themeBackup = threat.theme;
                    var cont = threat.cont;
                    threat.cont = undefined;

                    if (threat.theme) {
                        threat.theme = threat.theme.id;
                    }

                    if (cont) {
                        $scope.createNewThreat(ev);
                    }

                    ThreatService.createThreat(threat,
                        function () {
                            $scope.updateThreats();

                            if (threat.mode == 0 && threat.models && threat.models.length > 0) {
                                // If we create a generic threat, but we still have specific models, we should warn
                                toastr.warning(gettextCatalog.getString('The threat has been created successfully, however without models, the element may not be specific.',
                                    {threatLabel: $scope._langField(threat,'label')}));
                            } else {
                                toastr.success(gettextCatalog.getString('The threat has been created successfully.',
                                    {threatLabel: $scope._langField(threat,'label')}), gettextCatalog.getString('Creation successful'));
                            }
                        },

                        function () {
                            threat.theme = themeBackup;
                            $scope.createNewThreat(ev, threat);
                        }
                    );
                });
        };

        $scope.editThreat = function (ev, threat) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $scope.controls = [];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
            ThreatService.getThreat(threat.id).then(function (threatData) {
                $scope.controls = [{}];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
                $mdDialog.show({
                    controller: ['$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', '$q', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
                    templateUrl: 'views/anr/create.threats.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'threat': threatData
                    }
                })
                    .then(function (threat) {
                        var themeBackup = threat.theme;
                        if (threat.theme) {
                            threat.theme = threat.theme.id;
                        }

                        ThreatService.updateThreat(threat,
                            function () {
                                $scope.updateThreats();

                                if (threat.mode == 0 && threat.models && threat.models.length > 0) {
                                    // If we create a generic threat, but we still have specific models, we should warn
                                    toastr.warning(gettextCatalog.getString('The threat has been edited successfully, however without models, the element may not be specific.',
                                        {threatLabel: $scope._langField(threat,'label')}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The threat has been edited successfully.',
                                        {threatLabel: $scope._langField(threat,'label')}), gettextCatalog.getString('Edition successful'));
                                }
                                threat.theme = themeBackup;
                            },

                            function () {
                                threat.theme = themeBackup;
                                $scope.editThreat(ev, threat);
                            }
                        );
                    });
            });
        };

        $scope.deleteThreat = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete threat?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ThreatService.deleteThreat(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The threat has been deleted.',
                                    {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateThreats();
                        $scope.threats.selected = $scope.threats.selected.filter(threatSelected => threatSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteThreatMass = function (ev, item) {
            var outpromise = null;
            var count = $scope.threats.selected.length;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected threat(s)?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.threats.selected.length; ++i) {
                    ids.push($scope.threats.selected[i].id);
                }

                ThreatService.deleteMassThreat(ids, function () {
                    $scope.updateThreats();
                    toastr.success(gettextCatalog.getString('{{count}} threats have been deleted.',
                        {count: ids.length}), gettextCatalog.getString('Deletion successful'));
                });

                $scope.threats.selected = [];

            });
        };

        /*
         * VULNS TAB
         */
        $scope.vulns = TableHelperService.build('label' + $scope.userLanguage, 20, 1, '');
        $scope.vulns.activeFilter = 1;
        var vulnsFilterWatch;


        $scope.selectVulnsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'vulns'});
            var initVulnsFilter = true;
            vulnsFilterWatch = $scope.$watch('vulns.activeFilter', function() {
                if (initVulnsFilter) {
                    initVulnsFilter = false;
                } else {
                    $scope.updateVulns();
                }
            });

            TableHelperService.watchSearch($scope, 'vulns.query.filter', $scope.vulns.query, $scope.updateVulns, $scope.vulns);
        };

        $scope.deselectVulnsTab = function () {
            TableHelperService.unwatchSearch($scope.vulns);
            $scope.vulns.selected = [];
        };

        $scope.updateVulns = function () {
            var query = angular.copy($scope.vulns.query);
            query.status = $scope.vulns.activeFilter;

            if ($scope.vulns.previousQueryOrder != $scope.vulns.query.order) {
                $scope.vulns.query.page = query.page = 1;
                $scope.vulns.previousQueryOrder = $scope.vulns.query.order;
            }

            $scope.vulns.promise = VulnService.getVulns(query);
            $scope.vulns.promise.then(
                function (data) {
                    $scope.vulns.items = data;
                }
            )
        };
        $scope.removeVulnsFilter = function () {
            TableHelperService.removeFilter($scope.vulns);
        };

        $scope.toggleVulnStatus = function (vuln) {
            VulnService.patchVuln(vuln.id, {status: !vuln.status}, function () {
                vuln.status = !vuln.status;
            });
        }

        $scope.createNewVuln = function (ev, vuln) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'vuln', CreateVulnDialogCtrl],
                templateUrl: 'views/anr/create.vulns.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'vuln': vuln
                }
            })
                .then(function (vuln) {
                    var cont = vuln.cont;
                    vuln.cont = undefined;

                    if (cont) {
                        $scope.createNewVuln(ev);
                    }

                    VulnService.createVuln(vuln,
                        function () {
                            $scope.updateVulns();

                            if (vuln.mode == 0 && vuln.models && vuln.models.length > 0) {
                                // If we create a generic vulnerability, but we still have specific models, we should warn
                                toastr.warning(gettextCatalog.getString('The vulnerability has been created successfully, however without models, the element may not be specific.',
                                    {vulnLabel: $scope._langField(vuln,'label')}));
                            } else {
                                toastr.success(gettextCatalog.getString('The vulnerability has been created successfully.',
                                    {vulnLabel: $scope._langField(vuln,'label')}), gettextCatalog.getString('Creation successful'));
                            }
                        },

                        function () {
                            $scope.createNewVuln(ev, vuln);
                        }
                    );
                });
        };

        $scope.editVuln = function (ev, vuln) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $scope.controls = [];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
            VulnService.getVuln(vuln.id).then(function (vulnData) {
                $scope.controls = [{}];//hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'vuln', CreateVulnDialogCtrl],
                    templateUrl: 'views/anr/create.vulns.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'vuln': vulnData
                    }
                })
                    .then(function (vuln) {
                        VulnService.updateVuln(vuln,
                            function () {
                                $scope.updateVulns();

                                if (vuln.mode == 0 && vuln.models && vuln.models.length > 0) {
                                    // If we create a generic vulnerability, but we still have specific models, we should warn
                                    toastr.warning(gettextCatalog.getString('The vulnerability has been edited successfully, however without models, the element may not be specific.',
                                        {vulnLabel: $scope._langField(vuln,'label')}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The vulnerability has been edited successfully.',
                                        {vulnLabel: $scope._langField(vuln,'label')}), gettextCatalog.getString('Edition successful'));
                                }
                            },

                            function () {
                                $scope.editVuln(ev, vuln);
                            }
                        );
                    });
            });
        };

        $scope.deleteVuln = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete vulnerability?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                VulnService.deleteVuln(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The vulnerability has been deleted.',
                                    {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateVulns();
                        $scope.vulns.selected = $scope.vulns.selected.filter(vulSelected => vulSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteVulnMass = function (ev, item) {
            var count = $scope.vulns.selected.length;
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected vulnerabilites?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.vulns.selected.length; ++i) {
                    ids.push($scope.vulns.selected[i].id);
                }

                VulnService.deleteMassVuln(ids, function () {
                    $scope.updateVulns();
                    toastr.success(gettextCatalog.getString('{{count}} vulnerabilities have been deleted.',
                        {count: ids.length}), gettextCatalog.getString('Deletion successful'));
                });

                $scope.vulns.selected = [];

            });
        };

        /*
         * REFERENTIALS TAB
         */
        $scope.measures = TableHelperService.build('code', 20, 1, '');
        $scope.measures.activeFilter = 1;
        $scope.referentials = [];
        var measuresFilterWatch;

        $scope.selectMeasuresTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'measures'});
            $scope.updatingReferentials = false;
            ReferentialService.getReferentials({order: 'createdAt'}).then(function (data) {
                $scope.referentials.items = data;
                $scope.updatingReferentials = true;

            });
        };



        $scope.deselectMeasuresTab = function () {
            TableHelperService.unwatchSearch($scope.measures);
            $scope.measures.selected = [];
        };

        $scope.selectReferential = function (referentialId) {
            $scope.referential_uniqid = referentialId;
            ReferentialService.getReferential(referentialId).then(function (data) {
                $scope.referential = data;
            });

            var initMeasuresFilter = true;
            initMeasuresFilter = $scope.$watch('measures.activeFilter', function() {
                if (initMeasuresFilter) {
                    initMeasuresFilter = false;
                } else {
                    $scope.updateMeasures();
                }
            });
            TableHelperService.watchSearch($scope, 'measures.query.filter', $scope.measures.query, $scope.updateMeasures, $scope.measures);
        };

        $scope.deselectReferentialsTab = function () {
             TableHelperService.removeFilter($scope.measures);
             $scope.measures.selected = [];
         };

        $scope.removeMeasuresFilter = function () {
            TableHelperService.removeFilter($scope.measures);
        };

        $scope.toggleMeasureStatus = function (measure) {
            MeasureService.patchMeasure(measure.uniqid, {status: !measure.status}, function () {
                measure.status = !measure.status;
            });
        }

        $scope.updateReferentials = function () {
            $scope.updatingReferentials = false;
            $scope.referentials.promise = ReferentialService.getReferentials({order: 'createdAt'});
            $scope.referentials.promise.then(
                function (data) {
                    $scope.referentials.items = data;
                    $scope.updatingReferentials = true;
                }
            )
        };

        $scope.createNewReferential = function (ev, referential) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ReferentialService', 'ConfigService', 'referential', CreateReferentialDialogCtrl],
                templateUrl: 'views/anr/create.referentials.html',
                targetEvent: ev,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                  'referential' : referential
                }
            })
                .then(function (referential) {
                    var cont = referential.cont;
                    referential.cont = undefined;

                    if (cont) {
                        $scope.createNewReferential(ev);
                    }

                    ReferentialService.createReferential(referential,
                        function () {
                          $scope.updateReferentials();
                          toastr.success(gettextCatalog.getString('The referential has been created successfully.',
                                  {referntialLabel: $scope._langField(referential,'label')}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewReferential(ev, referential);
                        }
                    );
                });
        };

        $scope.editReferential = function (ev, referential) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ReferentialService.getReferential(referential).then(function (referentialData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ReferentialService', 'ConfigService', 'referential', CreateReferentialDialogCtrl],
                    templateUrl: 'views/anr/create.referentials.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'referential': referentialData
                    }
                })
                    .then(function (referential) {
                        ReferentialService.updateReferential(referential,
                            function () {
                                $scope.updateReferentials();
                                toastr.success(gettextCatalog.getString('The referential has been edited successfully.',
                                    {referentialLabel: referential.label1}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editReferential(ev, referential);
                            }
                        );
                    });
            });
        };

        $scope.matchReferential = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ReferentialService', 'MeasureService','ConfigService', 'MeasureMeasureService', '$q', 'measures', 'referentials', 'referentialSelected', MatchReferentialDialogCtrl],
                templateUrl: 'views/anr/match.referentials.html',
                targetEvent: ev,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                onRemoving : function(){$scope.selectReferential($scope.referential.uniqid)},
                locals: {
                    'measures' : $scope.measuresRefSelected,
                    'referentials': $scope.referentials.items,
                    'referentialSelected' : $scope.referential
                }
            })
        };

        $scope.deleteReferential = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete referential?',
                    {label: item.label1}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ReferentialService.deleteReferential(item,
                    function () {
                        $scope.updateReferentials();
                        toastr.success(gettextCatalog.getString('The referential has been deleted.',
                                    {label: item.label1}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.updateMeasures = function () {
            var query = angular.copy($scope.measures.query);
            query.status = $scope.measures.activeFilter;
            query.referential = $scope.referential_uniqid;

            if ($scope.measures.previousQueryOrder != $scope.measures.query.order) {
                $scope.measures.query.page = query.page = 1;
                $scope.measures.previousQueryOrder = $scope.measures.query.order;
            }

            MeasureService.getMeasures({referential:$scope.referential_uniqid, order:'code'}).then(function (data) {
                $scope.measuresRefSelected = data;
            });

            $scope.measures.promise = MeasureService.getMeasures(query);
            $scope.measures.promise.then(
                function (data) {
                  $scope.measures.items = data;
                }
            )
        };

        $scope.createNewMeasure = function (ev, measure) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: ['$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'SOACategoryService', 'MeasureService', 'ReferentialService', 'ConfigService', '$q', 'measure', 'referential', CreateMeasureDialogCtrl],
                templateUrl: 'views/anr/create.measures.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'measure': measure,
                    'referential' : $scope.referential
                }
            })
                .then(function (measure) {
                    var cont = measure.cont;
                    measure.cont = undefined;
                    measure.referential = $scope.referential.uniqid;
                    if (cont) {
                        $scope.createNewMeasure(ev);
                    }

                    MeasureService.createMeasure(measure,
                        function () {
                            $scope.updateMeasures();
                            toastr.success(gettextCatalog.getString('The control has been created successfully.',
                                {measureLabel: measure.label1}), gettextCatalog.getString('Creation successful'));
                        },

                        function (err) {
                            $scope.createNewMeasure(ev, measure);
                        }
                    );
                });
        };

        $scope.editMeasure = function (ev, measure) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            MeasureService.getMeasure(measure.uniqid).then(function (measureData) {
                $mdDialog.show({
                    controller: ['$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'SOACategoryService', 'MeasureService', 'ReferentialService', 'ConfigService', '$q', 'measure', 'referential', CreateMeasureDialogCtrl],
                    templateUrl: 'views/anr/create.measures.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'measure': measureData,
                        'referential' : $scope.referential
                    }
                })
                    .then(function (measure) {
                        MeasureService.updateMeasure(measure,
                            function () {
                                $scope.updateMeasures();
                                toastr.success(gettextCatalog.getString('The control has been edited successfully.',
                                    {measureLabel: measure.description1}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editMeasure(ev, measure);
                            }
                        );
                    });
            });
        };

        $scope.deleteMeasure = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete control?',
                    {label: item.label1}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                MeasureService.deleteMeasure(item.uniqid,
                    function () {
                        toastr.success(gettextCatalog.getString('The control has been deleted.',
                                    {label: item.label1}), gettextCatalog.getString('Deletion successful'));
                        $scope.updateMeasures();
                        $scope.measures.selected = $scope.measures.selected.filter(measureSelected => measureSelected.uniqid != item.uniqid);
                    }
                );
            });
        };

        $scope.deleteMeasureMass = function (ev, item) {
            var outpromise = null;
            var count = $scope.measures.selected.length;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected controls?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.measures.selected.length; ++i) {
                    ids.push($scope.measures.selected[i].uniqid);
                }

                MeasureService.deleteMassMeasure(ids, function () {
                    $scope.updateMeasures();
                    toastr.success(gettextCatalog.getString('{{count}} controls have been deleted.',
                        {count: count}), gettextCatalog.getString('Deletion successful'));
                });

                $scope.measures.selected = [];

            });
        };


        /*
         * AMVS TAB
         */
        $scope.amvs = TableHelperService.build('status', 20, 1, '');
        $scope.amvs.activeFilter = 1;
        var amvsFilterWatch;
        $scope.referentials_filter = [];

        $scope.selectAmvsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'amvs'});
            ReferentialService.getReferentials({order: 'createdAt'}).then(function (data) {
                $scope.referentials_filter.items = data;
                $scope.referentials_filter.selected = data['referentials'][0].uniqid;
            });
            var initAmvsFilter = true;
            initAmvsFilter = $scope.$watchGroup(['amvs.activeFilter', 'referentials_filter.selected', 'amvs.query.filter'], function(newValue, oldValue) {
                if (initAmvsFilter) {
                    initAmvsFilter = false;
                } else {
                    $scope.updateAmvs();
                }
            });
        };

        $scope.deselectAmvsTab = function () {
            TableHelperService.unwatchSearch($scope.amvs);
            $scope.amvs.selected = [];
        };

        $scope.updateAmvs = function () {
            var query = angular.copy($scope.amvs.query);
            query.status = $scope.amvs.activeFilter;
            query.referential = $scope.referentials_filter.selected;


            if ($scope.amvs.previousQueryOrder != $scope.amvs.query.order) {
                $scope.amvs.query.page = query.page = 1;
                $scope.amvs.previousQueryOrder = $scope.amvs.query.order;
            }

            $scope.amvs.promise = AmvService.getAmvs(query);
            $scope.amvs.promise.then(
                function (data) {
                    $scope.amvs.items = data;
                }
            )
        };

        $scope.removeAmvsFilter = function () {
            TableHelperService.removeFilter($scope.amvs);
        };


        $scope.toggleAmvStatus = function (amv) {
            AmvService.patchAmv(amv.id, {status: !amv.status}, function () {
                amv.status = !amv.status;
            })
        }


        $scope.createNewAmv = function (ev, amv) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'ReferentialService', 'ConfigService', 'AmvService', '$q', 'amv', 'referentials', CreateAmvDialogCtrl],
                templateUrl: 'views/anr/create.amvs.html',
                targetEvent: ev,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'amv': amv,
                    'referentials': $scope.referentials_filter.items['referentials']
                }
            })
                .then(function (amv) {
                    var amvBackup = angular.copy(amv);

                    if (amv.threat) {
                        amv.threat = amv.threat.id;
                    }
                    if (amv.asset) {
                        amv.asset = amv.asset.id;
                    }
                    if (amv.vulnerability) {
                        amv.vulnerability = amv.vulnerability.id;
                    }

                    var cont = amv.cont;
                    amv.cont = undefined;

                    if (cont) {
                        $scope.createNewAmv(ev);
                    }

                    AmvService.createAmv(amv,
                        function () {
                            $scope.updateAmvs();
                            toastr.success(gettextCatalog.getString('The risk has been created successfully.'), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewAmv(ev, amvBackup);
                        }
                    );
                });
        };

        $scope.editAmv = function (ev, amv) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            if(amv == null){
                return;
            }
            if(amv.id!=undefined){
                amv = amv.id;
            }

            AmvService.getAmv(amv).then(function (amvData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'ReferentialService', 'ConfigService', 'AmvService', '$q', 'amv', 'referentials', CreateAmvDialogCtrl],
                    templateUrl: 'views/anr/create.amvs.html',
                    targetEvent: ev,
                    preserveScope: false,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'amv': amvData,
                        'referentials' : $scope.referentials_filter.items['referentials']
                    }
                })
                    .then(function (amv) {
                        var amvBackup = angular.copy(amv);
                        if (amv.threat) {
                            amv.threat = amv.threat.id;
                        }
                        if (amv.asset) {
                            amv.asset = amv.asset.id;
                        }
                        if (amv.vulnerability) {
                            amv.vulnerability = amv.vulnerability.id;
                        }


                        AmvService.updateAmv(amv,
                            function () {
                                $scope.updateAmvs();
                                toastr.success(gettextCatalog.getString('The risk has been edited successfully.'), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editAmv(ev, amvBackup);
                            }
                        );
                    });
            });
        };

        if($stateParams.showid !== undefined){
            $scope.editAmv(null,$stateParams.showid);
        }


        $scope.deleteAmv = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete this risk?'))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AmvService.deleteAmv(item.id,
                    function () {
                        toastr.success(gettextCatalog.getString('The risk has been deleted.'), gettextCatalog.getString('Deletion successful'));
                        $scope.updateAmvs();
                        $scope.amvs.selected = $scope.amvs.selected.filter(amvSelected => amvSelected.id != item.id);
                    }
                );
            });
        };

        $scope.deleteAmvMass = function (ev, item) {
            var count = $scope.amvs.selected.length;
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected risk(s)?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var ids = [];
                for (var i = 0; i < $scope.amvs.selected.length; ++i) {
                    ids.push($scope.amvs.selected[i].id);
                }

                AmvService.deleteMassAmv(ids, function () {
                    toastr.success(gettextCatalog.getString('{{ count }} risks have been deleted.',
                        {count: count}), gettextCatalog.getString('Deletion successful'));
                    $scope.updateAmvs();
                });

                $scope.amvs.selected = [];

            }, function() {
            });
        };

        /*
         * OBJECTS LIBRARY TAB
         */
        var objLibTabSelected = false;
        $scope.objlibs = TableHelperService.build('name' + $scope.userLanguage, 20, 1, '');

        if ($rootScope.objlibs_query) {
            $scope.objlibs.query = $rootScope.objlibs_query;
            $scope.objlibs.previousQueryOrder = $scope.objlibs.query.order;
        }

        $scope.objlibs.category_filter = 0;
        $scope.objlibs.asset_filter = 0;
        $scope.objlibs.lockswitch = false;
        $scope.objlib_assets = [];

        $scope.$watchGroup(['objlibs.category_filter', 'objlibs.asset_filter', 'objlibs.lockswitch'], function (newValue, oldValue) {
            if ($scope.objlibs.category_filter == 0) {
                $scope.objlibs.lockswitch = false;
            }

            if (objLibTabSelected) {
                // Refresh contents
                $scope.updateObjlibs();
            }
        });

        $scope.objlibAssetTypeStr = function (type) {
            if (type == 'bdc') {
                return gettextCatalog.getString('Knowledge base');
            } else if (type == 'anr') {
                return gettextCatalog.getString('Risk analysis');
            } else {
                return type;
            }
        }

        $scope.objlibScopeStr = function (scope) {
            switch (scope) {
                case 1: return gettextCatalog.getString('Local');
                case 2: return gettextCatalog.getString('Global');
                default: return scope;
            }
        }

        $scope.resetObjlibsFilters = function () {
            $scope.objlibs.category_filter = 0;
            $scope.objlibs.asset_filter = 0;
            $scope.objlibs.lockswitch = false;
        };

        $scope.selectCategoryFilter = function (id) {
            $scope.objlibs.category_filter = id;
        };

        $scope.selectObjlibsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'objlibs'});
            objLibTabSelected = true;
            TableHelperService.watchSearch($scope, 'objlibs.query.filter', $scope.objlibs.query, $scope.updateObjlibs, $scope.objlibs);

            // Load all assets and categories to fill the md-select dropdowns
            AssetService.getAssets({order: '-code', limit: 0}).then(function (data) {
                $scope.objlib_assets = data.assets;
            });
            $scope.updateObjlibsTabCategoriesFilter();
        };

        $scope.deselectObjlibsTab = function () {
            objLibTabSelected = false;
            TableHelperService.unwatchSearch($scope.objlibs);
            $scope.objlibs.selected = [];
        };

        $scope.updateObjlibsTabCategoriesFilter = function () {
            ObjlibService.getObjlibsCats({limit: 0}).then(function (data) {
                var buildItemRecurse = function (children, depth) {
                    var output = [];

                    for (var i = 0; i < children.length; ++i) {
                        var child = children[i];

                        for (var j = 0; j < depth; ++j) {
                            child[$scope._langField('label')] = " >> " + $scope._langField(child,'label');
                        }

                        output.push(child);

                        if (child.child && child.child.length > 0) {
                            var child_output = buildItemRecurse(child.child, depth + 1);
                            output = output.concat(child_output);
                        }
                    }

                    return output;
                };

                $scope.objlib_categories = buildItemRecurse(data.categories, 0);
            });
        };

        $scope.updateObjlibs = function () {
            var query = angular.copy($scope.objlibs.query);
            if ($scope.objlibs.category_filter > 0 || $scope.objlibs.category_filter == -1) {
                query.category = $scope.objlibs.category_filter;
            }
            if ($scope.objlibs.asset_filter > 0) {
                query.asset = $scope.objlibs.asset_filter;
            }
            query.lock = $scope.objlibs.lockswitch;

            if ($scope.objlibs.previousQueryOrder != $scope.objlibs.query.order) {
                $scope.objlibs.query.page = query.page = 1;
                $scope.objlibs.previousQueryOrder = $scope.objlibs.query.order;
            }

            $scope.objlibs.promise = ObjlibService.getObjlibs(query);
            $scope.objlibs.promise.then(
                function (data) {
                    $scope.objlibs.items = data;
                    $rootScope.objlibs_query = $scope.objlibs.query;
                }
            )
        };

        $scope.removeObjlibsFilter = function () {
            TableHelperService.removeFilter($scope.objlibs);
            $scope.resetObjlibsFilters();
        };

        $scope.createNewObjlib = function (ev, objlib) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var isUpdate = (objlib && objlib.id);

            $scope.objLibDialog = $mdDialog;
            $scope.objLibDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'mode', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: 'views/anr/create.objlibs.html',
                targetEvent: ev,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    mode: 'bdc',
                    objLibDialog: $scope,
                    objlib: objlib
                }
            })
                .then(function (objlib) {
                    if (objlib) {
                        var cont = objlib.cont;
                        objlib.cont = undefined;

                        var objlibBackup = angular.copy(objlib);

                        if (objlib.asset) {
                            objlib.asset = objlib.asset.id;
                        }

                        if (objlib.rolfTag) {
                            objlib.rolfTag = objlib.rolfTag.id;
                        }

                        if (isUpdate) {
                            if( ! objlib.implicitPosition ){
                                objlib.implicitPosition = 2;//à la fin
                            }
                            ObjlibService.updateObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    $scope.updateObjlibsTabCategoriesFilter();
                                    toastr.success(gettextCatalog.getString('The asset has been edited successfully.',
                                        {objlibLabel: $scope._langField(objlib,'label')}), gettextCatalog.getString('Edition successful'));
                                },

                                function () {
                                    $scope.createNewObjlib(ev, objlibBackup);
                                }
                            );
                        } else {
                            if( ! objlib.implicitPosition ){
                                objlib.implicitPosition = 2;//à la fin
                            }
                            ObjlibService.createObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    $scope.updateObjlibsTabCategoriesFilter();
                                    toastr.success(gettextCatalog.getString('The asset has been created successfully.',
                                        {objlibLabel: $scope._langField(objlib,'label')}), gettextCatalog.getString('Creation successful'));

                                    if (cont) {
                                        $scope.createNewObjlib(ev);
                                    }
                                },

                                function () {
                                    $scope.createNewObjlib(ev, objlibBackup);
                                }
                            );
                        }
                    }
                }, function () {
                    $scope.updateObjlibs();
                    $scope.updateObjlibsTabCategoriesFilter();
                });
        };

        $scope.editObjlib = function (ev, objlib, dontFetch) {
            if (objlib && objlib.id) {
                if (dontFetch) {
                    $scope.createNewObjlib(ev, objlib);
                } else {
                    ObjlibService.getObjlib(objlib.id).then(function (objlibData) {
                        $scope.createNewObjlib(ev, objlibData);
                    });
                }
            } else {
                $scope.createNewObjlib(ev, objlib);
            }
        };

        $scope.deleteObjlib = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete asset?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ObjlibService.deleteObjlib(item.id,
                    function () {
                        $scope.updateObjlibs();
                        toastr.success(gettextCatalog.getString('The asset has been deleted.',
                                    {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteObjlibMass = function (ev, item) {
            var count = $scope.objlibs.selected.length;
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset(s)?',
                    {count: count}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.objlibs.selected, function (value, key) {
                    ObjlibService.deleteObjlib(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                toastr.success(gettextCatalog.getString('{{count}} assets have been deleted.',
                                    {count: count}), gettextCatalog.getString('Deletion successful'));
                                $scope.updateObjlibs();
                            }, 350);
                        }
                    );
                });

                $scope.objlibs.selected = [];

            }, function() {
            });
        };

        //Import File Center

        $scope.importFile = function (ev,tab) {
          var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
          $mdDialog.show({
              controller: ['$scope', '$mdDialog', 'ConfigService', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService',
                          'SOACategoryService', 'TagService', 'RiskService', 'toastr', 'gettextCatalog', '$q', 'tab', 'themes', 'categories', 'referential' ,'tags',  ImportFileDialogCtrl],
              templateUrl: 'views/anr/import.file.html',
              targetEvent: ev,
              scope: $scope.$dialogScope.$new(),
              preserveScope: false,
              clickOutsideToClose: false,
              fullscreen: useFullScreen,
              locals: {
                  'tab': tab,
                  'themes' : $scope.listThemes,
                  'categories' : $scope.listCategories,
                  'referential' : $scope.RefSelected,
                  'tags' : $scope.listTags
              }
          })
            .then(function(importData){
              switch (tab) {

                case 'Asset types':
                  AssetService.createAsset(importData, function (result){
                    $scope.$parent.updateAssets();
                    successCreateObject(result)
                  });
                  break;
                case 'Threats':
                  ThreatService.createThreat(importData, function (result){
                    $scope.$parent.updateThreats();
                    successCreateObject(result)
                  });
                  break;
                case 'Vulnerabilties':
                  VulnService.createVuln(importData, function (result){
                    $scope.$parent.updateVulns();
                    successCreateObject(result)
                  });
                  break;
                case 'Controls':
                  MeasureService.createMeasure(importData, function (result){
                    $scope.$parent.updateMeasures();
                    successCreateObject(result)
                  });
                  break;
                case 'Categories':
                  SOACategoryService.createCategory(importData, function (result){
                    successCreateObject(result)
                  });
                  break;
                case 'Tags':
                  TagService.createTag(importData, function (result){
                    $scope.$parent.updateTags();
                    successCreateObject(result)
                  });
                  break;
                case 'Operational Risks':
                  RiskService.createRisk(importData, function (result){
                    $scope.$parent.updateRisks();
                    successCreateObject(result)
                  });
                  break;

                default:
              }

              function successCreateObject(result){

                toastr.success(gettextCatalog.getString((result.id.length ? result.id.length : 1) + ' ' + tab + ' ' + 'have been created successfully.'),
                               gettextCatalog.getString('Creation successful'));

              };
            })
        }
    }


    //////////////////////
    // DIALOGS
    //////////////////////

    function CreateAssetDialogCtrl($scope, $mdDialog, ModelService, ConfigService, asset) {
        ModelService.getModels({isGeneric:0}).then(function (data) {
            $scope.models = data.models;
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();


        if (asset != undefined && asset != null) {
            $scope.asset = asset;
            var modelsIds = [];

            for (var i = 0; i < $scope.asset.models.length; ++i) {
                if ($scope.asset.models[i].id) {
                    modelsIds.push($scope.asset.models[i].id);
                } else {
                    modelsIds.push($scope.asset.models[i]);
                }
            }

            $scope.asset.models = modelsIds;
        } else {
            $scope.asset = {
                mode: 0,
                code: '',
                type: 2,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                models: []
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if (Object.keys($scope.assetForm.$error).length == 0) {
                $mdDialog.hide($scope.asset);
            }
        };

        $scope.createAndContinue = function() {
            if (Object.keys($scope.assetForm.$error).length == 0) {
                $scope.asset.cont = true;
                $mdDialog.hide($scope.asset);
            }
        };
    }

    function CreateThreatDialogCtrl($scope, toastr, $mdMedia, $mdDialog, gettextCatalog, $q, ModelService, ThreatService, ConfigService, threat) {
        ModelService.getModels({isGeneric:0}).then(function (data) {
            $scope.models = data.models;
        });

        ThreatService.getThemes().then(function (data) {
           $scope.listThemes = data['themes'];
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.themeSearchText = '';

        if (threat != undefined && threat != null) {
            $scope.threat = threat;

            var modelsIds = [];

            for (var i = 0; i < $scope.threat.models.length; ++i) {
                if ($scope.threat.models[i].id) {
                    modelsIds.push($scope.threat.models[i].id);
                } else {
                    modelsIds.push($scope.threat.models[i]);
                }
            }

            $scope.threat.models = modelsIds;

            $scope.threat.c = ($scope.threat.c == 1);
            $scope.threat.i = ($scope.threat.i == 1);
            $scope.threat.a = ($scope.threat.a == 1);

        } else {
            $scope.threat = {
                mode: 0,
                code: '',
                c: false,
                i: false,
                a: false,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
            };
        }

        $scope.$watch('language', function() {
          if ($scope.threat.theme) {
            $scope.themeSearchText = $scope.threat.theme['label' + $scope.language];
          }
        });

        $scope.queryThemeSearch = function (query) {
            var promise = $q.defer();
            ThreatService.getThemes({filter: query}).then(function (data) {
                promise.resolve(data.themes);
            }, function () {
                promise.reject();
            });
            return promise.promise;
        };

        $scope.selectedThemeItemChange = function (item) {
            $scope.threat.theme = item;
        }

        $scope.createNewTheme = function (ev, theme) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'theme', CreateThemeDialogCtrl],
                templateUrl: 'views/anr/create.themes.html',
                targetEvent: ev,
                multiple: true,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'theme': theme
                }
            })
                .then(function (theme) {
                    var cont = theme.cont;
                    theme.cont = undefined;
                    if (cont) {
                        $scope.createNewTheme(ev);
                    }

                    ThreatService.createTheme(theme,
                        function (status) {
                        theme.id = status.id;
                        $scope.selectedThemeItemChange(theme);
                        toastr.success(gettextCatalog.getString('The theme has been created successfully.',
                            {themeLabel: $scope._langField(theme,'label')}), gettextCatalog.getString('Creation successful'));
                        },
                        function (err) {
                            $scope.createNewTheme(ev, theme);
                        }
                    );
                });
        };

        $scope.editTheme = function (ev, theme) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ThreatService.getTheme(theme.id).then(function (themeData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService','theme', CreateThemeDialogCtrl],
                    templateUrl: 'views/anr/create.themes.html',
                    targetEvent: ev,
                    preserveScope: false,
                    multiple: true,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                      'theme': theme
                    }
                })
                    .then(function (theme) {
                        ThreatService.updateTheme(theme,
                            function () {
                                $scope.themeSearchText = theme['label' + $scope.language];
                                $scope.selectedThemeItemChange(theme);
                                toastr.success(gettextCatalog.getString('The theme has been edited successfully.',
                                    {themeLabel: $scope._langField(theme,'label')}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editTheme(ev, theme);
                            }
                        );
                    });
            });
        };

        $scope.deleteTheme= function (ev, theme) {
            var confirm = $mdDialog.confirm()
                .multiple(true)
                .title(gettextCatalog.getString('Are you sure you want to delete theme?',
                    {label: $scope._langField(theme,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                  ThreatService.deleteTheme(theme.id,
                      function () {
                        $scope.selectedThemeItemChange();
                         toastr.success(gettextCatalog.getString('The theme has been deleted.',
                         {label: $scope._langField(theme,'label')}), gettextCatalog.getString('Deletion successful'));
                      }
                  );
            });
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.threat);
        };
        $scope.createAndContinue = function () {
            $scope.threat.cont = true;
            $mdDialog.hide($scope.threat);
        }
    }

    function CreateThemeDialogCtrl($scope, $mdDialog,  ConfigService, theme) {

      $scope.languages = ConfigService.getLanguages();
      $scope.language = ConfigService.getDefaultLanguageIndex();

        if (theme != undefined && theme != null) {
            $scope.theme = theme;
        } else {
            $scope.theme = {
                label1: '',
                label2: '',
                label3: '',
                label4: '',
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.theme);
        };
        $scope.createAndContinue = function() {
            $scope.category.cont = true;
            $mdDialog.hide($scope.theme);
        };

    }

    function CreateVulnDialogCtrl($scope, $mdDialog, ModelService, ConfigService, vuln) {
        ModelService.getModels({isGeneric:0}).then(function (data) {
            $scope.models = data.models;
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (vuln != undefined && vuln != null) {
            $scope.vuln = vuln;

            var modelsIds = [];

            for (var i = 0; i < $scope.vuln.models.length; ++i) {
                if ($scope.vuln.models[i].id) {
                    modelsIds.push($scope.vuln.models[i].id);
                } else {
                    modelsIds.push($scope.vuln.models[i]);
                }
            }

            $scope.vuln.models = modelsIds;
        } else {
            $scope.vuln = {
                mode: 0,
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.vuln);
        };
        $scope.createAndContinue = function () {
            $scope.vuln.cont = true;
            $mdDialog.hide($scope.vuln);
        }
    }

    function CreateReferentialDialogCtrl($scope, $mdDialog, ReferentialService, ConfigService, referential) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        var defaultLang = angular.copy($scope.language);

        if (referential != undefined && referential != null) {
            $scope.referential = referential;
            delete $scope.referential.measures;
        } else {
          $scope.referential = {
              label1: '',
              label2: '',
              label3: '',
              label4: '',
          };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            for (var i = 1; i <=4; i++) {
              if ($scope.referential['label' + i] == '' && i != defaultLang) {
                $scope.referential['label' + i] = $scope.referential['label' + defaultLang];
              }
            }
            $mdDialog.hide($scope.referential);
        };
        $scope.createAndContinue = function () {
            for (var i = 1; i <=4; i++) {
              if ($scope.referential['label' + i] == '' && i != defaultLang) {
                $scope.referential['label' + i] = $scope.referential['label' + defaultLang];
              }
            }
            $scope.referential.cont = true;
            $mdDialog.hide($scope.referential);
        }
    }
    function MatchReferentialDialogCtrl($scope, $mdDialog, ReferentialService, MeasureService, ConfigService, MeasureMeasureService, $q, measures, referentials, referentialSelected) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.measuresRefSelected = measures.measures;
        $scope.referentialsList = referentials;
        $scope.referentialSelected = referentialSelected;
        $scope.matchMeasures = [];
        $scope.matchRef_filter = '';

        $scope.referentialsList.referentials.forEach(function (ref){
          var promise = $q.defer();
          if (ref.uniqid !== $scope.referentialSelected.uniqid ) {
            $scope.matchMeasures[ref.uniqid] = [];
            $scope.measuresRefSelected.forEach(function (measure){
              $scope.matchMeasures[ref.uniqid][measure.uniqid] = [];
              if (Array.isArray(measure.measuresLinked)) {
                measure.measuresLinked.forEach(function (measureLinked){
                  var measureFound = ref.measures.filter(ml => ml.uniqid == measureLinked.uniqid);
                  if (measureFound.length > 0) {
                    $scope.matchMeasures[ref.uniqid][measure.uniqid].push(measureLinked);
                  }
                })
              }
              promise.resolve($scope.matchMeasures[ref.uniqid][measure.uniqid]);
            });
            return promise.promise;
          }
        });

        $scope.queryMeasureSearch = function (query, referential, measureUniqid ) {
            var promise = $q.defer();
            MeasureService.getMeasures({filter: query, referential: referential, order: 'code'}).then(function (e) {
              var filtered = [];
              for (var j = 0; j < e.measures.length; ++j) {
                  var found = false;
                  for (var i = 0; i < $scope.matchMeasures[referential][measureUniqid].length; ++i) {

                      if ($scope.matchMeasures[referential][measureUniqid][i].uniqid == e.measures[j].uniqid) {
                          found = true;
                          break;
                      }
                  }

                  if (!found) {
                      filtered.push(e.measures[j]);
                  }
              }

              promise.resolve(filtered);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.addMeasureLinked = function(fatherId,childId) {
          var measuremeasure  = {
              father: fatherId,
              child: childId,
          };
          MeasureMeasureService.createMeasureMeasure(measuremeasure);
        };

        $scope.deleteMeasureLinked = function(fatherId,childId) {
          MeasureMeasureService.getMeasuresMeasures({fatherId:fatherId, childId: childId}).then(function(e) {
            if (e.count > 0) {
              var id  = {
                  father: fatherId,
                  child: childId,
              };
              MeasureMeasureService.deleteMeasureMeasure(id);
            }
          });
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.matchMeasures);
        };
    }

    function CreateMeasureDialogCtrl($scope, toastr, $mdMedia, $mdDialog, gettextCatalog, SOACategoryService,
                                    MeasureService, ReferentialService, ConfigService, $q, measure, referential) {

        SOACategoryService.getCategories({order: $scope._langField('label'), referential: referential.uniqid}).then(function (data) {
           $scope.listCategories = data['categories'];
        });
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.categorySearchText = '';
        $scope.RefSelected = referential;
        if (measure != undefined && measure != null) {
            $scope.measure = measure;
        } else {
            $scope.measure = {
                referential: referential,
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                category: '',
            };
        }

        $scope.$watch('language', function() {
          if ($scope.measure.category) {
            $scope.categorySearchText = $scope.measure.category['label' + $scope.language];
          }
        });

        $scope.queryCategorySearch = function (query) {
            var promise = $q.defer();
            SOACategoryService.getCategories({filter: query, referential: referential.uniqid}).then(function (data) {
                promise.resolve(data['categories']);
            }, function () {
                promise.reject();
            });
            return promise.promise;
        };

        $scope.selectedCategoryItemChange = function (item) {
            $scope.measure.category = item;
        }

        $scope.createNewCategory = function (ev, referential, category) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService','referential', 'category',  CreateCategoryDialogCtrl],
                templateUrl: 'views/anr/create.categories.html',
                targetEvent: ev,
                multiple: true,
                preserveScope: false,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'referential': referential,
                    'category': category
                }
            })
                .then(function (category) {
                    var cont = category.cont;
                    category.cont = undefined;
                    if (cont) {
                        $scope.createNewCategory(ev);
                    }

                    SOACategoryService.createCategory(category,
                        function (status) {
                          category.id = status.id;
                          $scope.selectedCategoryItemChange(category);
                            toastr.success(gettextCatalog.getString('The category has been created successfully.',
                                {categoryLabel: $scope._langField(category,'label')}), gettextCatalog.getString('Creation successful'));
                        },

                        function (err) {
                            $scope.createNewCategory(ev, category);
                        }
                    );
                });
        };

        $scope.editCategory = function (ev, referential, category) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            SOACategoryService.getCategory(category.id).then(function (categoryData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService','referential', 'category', CreateCategoryDialogCtrl],
                    templateUrl: 'views/anr/create.categories.html',
                    targetEvent: ev,
                    preserveScope: false,
                    multiple: true,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                      'referential': referential,
                      'category': category
                    }
                })
                    .then(function (category) {
                        SOACategoryService.updateCategory(category,
                            function () {
                                $scope.categorySearchText = category['label' + $scope.language];
                                $scope.selectedCategoryItemChange(category);
                                toastr.success(gettextCatalog.getString('The category has been edited successfully.',
                                    {categoryLabel: $scope._langField(category,'label')}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editCategory(ev, category);
                            }
                        );
                    });
            });
        };

        $scope.deleteCategory = function (ev, category) {
            var confirm = $mdDialog.confirm()
                .multiple(true)
                .title(gettextCatalog.getString('Are you sure you want to delete category?',
                    {label: $scope._langField(category,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
              // once we  delete a category the measure linked to this category have their category-id changed to null
              MeasureService.getMeasures({category: category.id}).then(function (data) {
                if (data.count > 0) {
                  data.measures.forEach( function(measure){
                    measure.category = null;
                     MeasureService.updateMeasure(measure,
                         function () {
                           SOACategoryService.deleteCategory(category.id,
                               function () {
                                 $scope.selectedCategoryItemChange();
                                  toastr.success(gettextCatalog.getString('The category has been deleted.',
                                  {label: $scope._langField(category,'label')}), gettextCatalog.getString('Deletion successful'));
                               }
                           );
                          }
                     );
                  })
                } else {
                  SOACategoryService.deleteCategory(category.id,
                      function () {
                        $scope.selectedCategoryItemChange();
                         toastr.success(gettextCatalog.getString('The category has been deleted.',
                         {label: $scope._langField(category,'label')}), gettextCatalog.getString('Deletion successful'));
                      }
                  );
                }
              })
            });
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.measure);
        };
        $scope.createAndContinue = function () {
            $scope.measure.cont = true;
            $mdDialog.hide($scope.measure);
        }
    }

    function CreateCategoryDialogCtrl($scope, $mdDialog,  ConfigService, referential, category) {

      $scope.languages = ConfigService.getLanguages();
      $scope.language = ConfigService.getDefaultLanguageIndex();

        if (category != undefined && category != null) {
            $scope.category = category;
            delete $scope.category.measures;
            $scope.category.referential = referential;
        } else {
            $scope.category = {
                code: '',
                referential: referential,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.category);
        };
        $scope.createAndContinue = function() {
            $scope.category.cont = true;
            $mdDialog.hide($scope.category);
        };

    }

    function CreateAmvDialogCtrl($scope, $mdDialog, AssetService, ThreatService, VulnService, MeasureService, ReferentialService, ConfigService, AmvService, $q, amv, referentials) {
        $scope.languages = ConfigService.getLanguages();
        $scope.defaultLang = ConfigService.getDefaultLanguageIndex();

        $scope.queryAmvs = function (asset_id) {
            AmvService.getAmvs({limit: 0, asset: asset_id, order: 'position', amvid: $scope.amv.id}).then(function (data) {
                $scope.asset_amvs = data.amvs;
            });
        };

        if (amv != undefined && amv != null) {
            $scope.amv = amv;

            if (amv.asset && amv.asset.id) {
                $scope.queryAmvs(amv.asset.id);
            }
            if (amv.previous && amv.previous.id) {
                $scope.amv.previous = $scope.amv.previous.id;
            }
            if (amv.measures.length == undefined) {
              $scope.amv.measures = [];
              referentials.forEach(function (ref){
                $scope.amv.measures[ref.uniqid] = [];
              })
            } else {
              var measuresBackup = $scope.amv.measures;
              $scope.amv.measures = [];
              referentials.forEach(function (ref){
                $scope.amv.measures[ref.uniqid] = measuresBackup.filter(function (measure) {
                    return (measure.referential.uniqid == ref.uniqid);
                })
              })
            }
        } else {
            $scope.amv = {
                asset: null,
                threat: null,
                vulnerability: null,
                referential : null,
                measures: [],
                implicitPosition: 2,
                status: 1
            };
            referentials.forEach(function (ref){
              $scope.amv.measures[ref.uniqid] = [];
            })
        }

        // Asset
        $scope.queryAssetSearch = function (query) {
            var promise = $q.defer();
            AssetService.getAssets({filter: query, type: 2, status: 1}).then(function (e) {
                promise.resolve(e.assets);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedAssetItemChange = function (item) {
            if (item) {
                $scope.amv.asset = item;
                $scope.queryAmvs(item.id);
            }
        }

        // Threat
        $scope.queryThreatSearch = function (query) {
            var promise = $q.defer();
            ThreatService.getThreats({filter: query, status: 1}).then(function (e) {
                promise.resolve(e.threats);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedThreatItemChange = function (item) {
            if (item) {
                $scope.amv.threat = item;
            }
        }

        // Vulnerability
        $scope.queryVulnSearch = function (query) {
            var promise = $q.defer();
            VulnService.getVulns({filter: query, status: 1}).then(function (e) {
                promise.resolve(e.vulnerabilities);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedVulnItemChange = function (item) {
            if (item) {
                $scope.amv.vulnerability = item;
            }
        }

        // Referentials

        $scope.queryReferentialsSearch = function (query) {
            var promise = $q.defer();
            ReferentialService.getReferentials({order: 'createdAt'}).then(function (e) {
                promise.resolve(e.referentials);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedReferentialItemChange = function (item) {
            if (item) {
                $scope.amv.referential = item;
            }
        }

        // Measures
        $scope.queryMeasureSearch = function (query) {
            var promise = $q.defer();
            MeasureService.getMeasures({filter: query, referential: $scope.amv.referential.uniqid, order: 'code'}).then(function (e) {
              var filtered = [];
              for (var j = 0; j < e.measures.length; ++j) {
                  var found = false;
                  for (var i = 0; i < $scope.amv.measures[$scope.amv.referential.uniqid].length; ++i) {

                      if ($scope.amv.measures[$scope.amv.referential.uniqid][i].uniqid == e.measures[j].uniqid) {
                          found = true;
                          break;
                      }
                  }

                  if (!found) {
                      filtered.push(e.measures[j]);
                  }
              }

              promise.resolve(filtered);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {

            referentials.forEach(function (ref){
              var promise = $q.defer();
              if ($scope.amv.measures[ref.uniqid] != undefined) {
                $scope.amv.measures[ref.uniqid].forEach (function (measure) {
                  promise.resolve($scope.amv.measures.push(measure.uniqid));
                })
              }
              return promise.promise;

            })

            if ($scope.amv.implicitPosition == 3 && !$scope.amv.previous) {
                $scope.amv.implicitPosition = 1;
            }

            $mdDialog.hide($scope.amv);
        };
        $scope.createAndContinue = function () {

            referentials.forEach(function (ref){
              var promise = $q.defer();
              if ($scope.amv.measures[ref.uniqid] != undefined) {
                $scope.amv.measures[ref.uniqid].forEach (function (measure) {
                  promise.resolve($scope.amv.measures.push(measure.uniqid));
                })
              }
              return promise.promise;
            })

            if ($scope.amv.implicitPosition == 3 && !$scope.amv.previous) {
                $scope.amv.implicitPosition = 1;
            }

            $scope.amv.cont = true;
            $mdDialog.hide($scope.amv);
        };
    }

    function ExportAssetDialog($scope, $mdDialog, mode) {
        $scope.mode = mode;
        $scope.exportData = {
            password: null,
            simple_mode: true,
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.export = function() {
            $mdDialog.hide($scope.exportData);
        };
    }

    function ImportFileDialogCtrl($scope, $mdDialog, ConfigService, AssetService, ThreatService, VulnService, MeasureService, SOACategoryService,
                                  TagService, RiskService, toastr, gettextCatalog, $q, tab, themes, categories, referential, tags) {

      $scope.tab = tab;
      $scope.guideVisible = false;
      $scope.languages = ConfigService.getLanguages();
      $scope.language = ConfigService.getDefaultLanguageIndex();
      $scope.defaultLang = angular.copy($scope.language);

      switch (tab) {
        case 'Asset types':
          var getService = AssetService.getAssets();
          var items = 'assets';
          break;
        case 'Threats':
          var getService = ThreatService.getThreats();
          var items = 'threats';
          var externalItem = 'theme';
          $scope.actualExternalItems = themes;
          var extItemLabel = gettextCatalog.getString('themes');
        break;
        case 'Vulnerabilties':
          var getService = VulnService.getVulns();
          var items = 'vulnerabilities'; break;
        case 'Controls':
          var getService = MeasureService.getMeasures();
          var items = 'measures';
          var externalItem = 'category';
          $scope.actualExternalItems = categories;
          console.log($scope.actualExternalItems);
          var extItemLabel = gettextCatalog.getString('categories');
        break;
        case 'Categories':
          var getService = SOACategoryService.getCategories();
          var items = 'categories';
        break;
        case 'Tags':
          var getService = TagService.getTags();
          var items = 'tags'; break;
        case 'Operational Risks':
          var getService = RiskService.getRisks();
          var externalItem = 'tags';
          $scope.actualExternalItems = tags;
          var extItemLabel = gettextCatalog.getString('tags');
          var items = 'risks';
        break;
        default:
      }

      $scope.items = {
        'Asset types' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('Network')
            },
            'description' : {
              'field' : 'description1\ndescription2\ndescription3\ndescription4',
              'required' : false,
              'type' : 'text',
              'example' : gettextCatalog.getString('Any network hardware (router, switch, firewall, etc.)')
            },
            'type' : {
              'field' : 'type',
              'required' : true,
              'type' : '1,2',
              'example' : gettextCatalog.getString('\n1: primary asset\n2: secondary asset')
            },
            'mode' : {
              'field' : 'mode',
              'required' : true,
              'type' : '0,1',
              'example' : gettextCatalog.getString('\n1: generic\n2: specific')
            }
        },
        'Threats' : {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('Fire')
            },
            'description' : {
              'field' : 'description1\ndescription2\ndescription3\ndescription4',
              'required' : false,
              'type' : 'text',
              'example' : gettextCatalog.getString('Any situation that could facilitate the conflagration of premises or equipment.')
            },
            'c' : {
              'field' : 'c',
              'required' : false,
              'type' : 'Boolean',
              'example' : '0,1,false,true'
            },
            'i' : {
              'field' : 'i',
              'required' : false,
              'type' : 'Boolean',
              'example' : '0,1,false,true'
            },
            'a' : {
              'field' : 'a',
              'required' : false,
              'type' : 'Boolean',
              'example' : '0,1,false,true'
            },
            'mode' : {
              'field' : 'mode',
              'required' : true,
              'type' : '0,1',
              'example' : gettextCatalog.getString('\n0: generic\n1: specific')
            },
            'theme' : {
              'field' : 'theme',
              'required' : true,
              'type' : 'text',
              'example' : $scope.actualExternalItems
            }
        },
        'Vulnerabilties' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('No IT charter specifying the rules of use')
            },
            'description' : {
              'field' : 'description1\ndescription2\ndescription3\ndescription4',
              'required' : false,
              'type' : 'text',
              'example' : gettextCatalog.getString('IT charter Conditions of use General terms and conditions')
            },
            'mode' : {
              'field' : 'mode',
              'required' : true,
              'type' : '0,1',
              'example' : gettextCatalog.getString('\n0: generic\n1: specific')
            }
        },
        'Controls' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('')
            },
            'category' : {
              'field' : 'category',
              'required' : false,
              'type' : 'text',
              'example' : $scope.actualExternalItems
            }
        },
        'Categories' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('label + language number (See footerpage): Ex. label1, label2,...')
            }
        },
        'Tags' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('')
            }
        },
        'Operational Risks' :  {
            'code' : {
              'field' : 'code',
              'required' : true,
              'type' : 'text',
              'example' : 'C16, 123, CAZ, C-12'
            },
            'label' : {
              'field' : 'label' + $scope.defaultLang,
              'fieldBis' : 'label1\nlabel2\nlabel3\nlabel4',
              'required' : true,
              'type' : 'text',
              'example' : gettextCatalog.getString('label + language number (See footerpage): Ex. label1, label2,...')
            },
            'description' : {
              'field' : 'description1\ndescription2\ndescription3\ndescription4',
              'required' : false,
              'type' : 'text',
              'example' : gettextCatalog.getString('')
            },
            'tags' : {
              'field' : 'tags',
              'required' : false,
              'type' : 'text',
              'example' : gettextCatalog.getString('Separed by /') + $scope.actualExternalItems
            }
        }
      };

      $scope.parseFile = function (fileContent) {
        $scope.check = false;
        Papa.parse(fileContent, {
                          header: true,
                          skipEmptyLines: true,
                          trimHeaders : true,
                          beforeFirstChunk: function( chunk ) {
                            var rows = chunk.split( /\r\n|\r|\n/ );
                            rows[0] = rows[0].toLowerCase();
                            return rows.join( '\n' );
                          },
                          complete: function(importData) {
                                    $scope.importData = $scope.checkFile(importData);
                          }
                  });
      };

      $scope.getItems = function (){
        var promise = $q.defer();
        getService.then(function (e) {
            promise.resolve(e[items]);
        }, function (e) {
            promise.reject(e);
        });
          return promise.promise
      };

      $scope.createThemes = async function () {
          var promise = $q.defer();
          var themesData = {};
          if ($scope.extItemToCreate && $scope.extItemToCreate.length > 0) {
             for (let i = 0; i < $scope.extItemToCreate.length; i++) {
               themesData[i] = {
                 label1: '',
                 label2: '',
                 label3: '',
                 label4: '',
               };
               for (var j = 1; j <= 4; j++) {
                 themesData[i]['label' + j] = $scope.extItemToCreate[i];
               }
             }

             ThreatService.createTheme(themesData, function(){
                ThreatService.getThemes().then(function (e) {
                    promise.resolve(e.themes);
                }, function (e) {
                    promise.reject();
                });
             });
          }else {
            ThreatService.getThemes().then(function (e) {
                promise.resolve(e.themes);
            }, function (e) {
                promise.reject();
            });
          }
          return promise.promise;
      };

      $scope.createCategories = function () {
          var promise = $q.defer();
          var categoryData = {};
          if ($scope.extItemToCreate && $scope.extItemToCreate.length > 0) {
            for (let i = 0; i < $scope.extItemToCreate.length; i++) {
               categoryData[i] = {
                 code: 'Temp' + Math.floor(Math.random() * 1000), //Ramdon code
                 referential: referential,
                 label1: '',
                 label2: '',
                 label3: '',
                 label4: '',
               };
               for (var j = 1; j <= 4; j++) {
                 categoryData[i]['label' + j] = $scope.extItemToCreate[i];
               }
            }
            SOACategoryService.createCategory(categoryData, function(){
               SOACategoryService.getCategories().then(function (e) {
                   promise.resolve(e.categories);
               }, function (e) {
                   promise.reject();
               });
            });
          }else {
            SOACategoryService.getCategories().then(function (e) {
                promise.resolve(e.categories);
            }, function (e) {
                promise.reject();
            });
          }
          return promise.promise;
      };

      $scope.createTags = function () {
          var promise = $q.defer();
          var tagsData = {};
          if ($scope.extItemToCreate && $scope.extItemToCreate.length > 0) {
            for (let i = 0; i < $scope.extItemToCreate.length; i++) {
                tagsData[i] = {
                  code: $scope.extItemToCreate[i] + Math.floor(Math.random() * 1000),
                  label1: '',
                  label2: '',
                  label3: '',
                  label4: '',
                };
                for (var j = 1; j <= 4; j++) {
                  tagsData[i]['label' + j] = $scope.extItemToCreate[i];
                }
            }
            TagService.createTag(tagsData, function(){
               TagService.getTags().then(function (e) {
                   promise.resolve(e.tags);
               }, function (e) {
                   promise.reject();
               });
            });
          }else {
            TagService.getTags().then(function (e) {
                promise.resolve(e.tags);
            }, function (e) {
                promise.reject();
            });
          }
          return promise.promise;
      };

      $scope.checkFile = function (file) {
        $scope.extItemToCreate = [];
        $scope.getItems().then(async function(items){

          if (externalItem) {
            if (externalItem == 'tags') {
              var tags = [];
              file.data.forEach(function(list){
                var tag = list['tags'].toString().split("/");
                tag.forEach(function(t){
                  tags.push(t);
                })
              });
              var uniqueLabels = new Set(tags);
            }else{
              var uniqueLabels = new Set(file.data.map(item => item[externalItem]));
            }

            for (let label of uniqueLabels){
              var found = false;
              if (label) {
                $scope.actualExternalItems.filter(function(ei){
                  for (var i = 1; i <=4; i++) {
                    if (ei['label' + i].toLowerCase() === label.toLowerCase().trim()){
                      found = true;
                    }
                  }
                });
                if (!found) {
                  $scope.extItemToCreate.push(label);
                }
              }
            }
          }

          if (tab == 'Controls') {
             items = items.filter(item => item.referential.uniqid == referential)
          }

          var codes = items.map(item => item.code.toLowerCase());
          var requiredFields = [];
          for(var index in $scope.items[tab]) {
            if ($scope.items[tab][index]['required']) {
              requiredFields.push($scope.items[tab][index]['field']);
            }
          }
          for (var i = 0; i < file.data.length; i++) {
            file.data[i].error = '';
            file.data[i].alert = false;

            if (file.data[i]['code'] && codes.includes(file.data[i]['code'].toLowerCase())) {
                file.data[i].error += gettextCatalog.getString('code is already in use\n');
                $scope.check = true;
            }


            for (var j = 0; j < requiredFields.length; j++) {
              if (!file.data[i][requiredFields[j]]) {
                file.data[i].error += requiredFields[j] + gettextCatalog.getString(' is mandatory\n');
                $scope.check = true;
              }
            }
            if (!$scope.check && $scope.extItemToCreate.length > 0 && $scope.extItemToCreate.includes(file.data[i][externalItem])) {
                file.data[i].alert = true;
            }

            codes.push(file.data[i]['code'].toLowerCase());
          }
          if (!$scope.check && $scope.extItemToCreate.length > 0) {
            var confirm = $mdDialog.confirm()
                .multiple(true)
                .title(gettextCatalog.getString('New {{extItemLabel}}',
                        {extItemLabel: extItemLabel}))
                .textContent(gettextCatalog.getString('Do you want to create {{count}} new {{extItemLabel}} ?\n\r\n\r',
                              {count: $scope.extItemToCreate.length, extItemLabel: extItemLabel}) +
                               $scope.extItemToCreate.toString().replace(/,/g,'\n\r'))
                .theme('light')
                .ok(gettextCatalog.getString('Create & Import'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
              $scope.uploadFile();
            });
          }
        });
        return file.data;
      };

      $scope.uploadFile = async function () {

        var itemsToImport = $scope.importData.length;
        switch (tab) {
          case 'Threats':
            $scope.getThemes = await $scope.createThemes();
            break;
          case 'Controls':
            $scope.getCategories = await $scope.createCategories();
            break;
          case 'Operational Risks':
            $scope.getTags = await $scope.createTags();
            break;
          default:
        }
        var cia = ['c','i','a'];
        var itemFields= ['label1','label2','label3','label4','description1','description2','description3','description4'];
        for(var index in $scope.items[tab]) {
            itemFields.push($scope.items[tab][index]['field']);
        }

        await $scope.importData.forEach(function(postData){
          var postDataKeys = Object.keys(postData);
          for (let pdk of postDataKeys){
            if(!itemFields.includes(pdk.toLowerCase())){
              delete postData[pdk];
            }
          }

          if (tab == 'Threats') {
            for (let i = 0; i < cia.length; i++) {
              if (!postData[cia[i]] || postData[cia[i]] == 0 || postData[cia[i]].toLowerCase() == 'false' ) {
                postData[cia[i]] = false;
              } else {
                postData[cia[i]] = true;
              }
            }
            if (postData['theme']) {
              $scope.getThemes.filter(function(theme){
                for (var i = 1; i <=4; i++) {
                  if (theme['label' + i] && theme['label' + i].toLowerCase() === postData.theme.toLowerCase().trim()){
                    $scope.idTheme =  theme.id;
                  }
                }
              });
              postData.theme = $scope.idTheme;
            }
          }
          if (tab == 'Controls') {
            postData.referential = referential;

            if (postData['category']) {
              $scope.getCategories.filter(function(category){
                for (var i = 1; i <=4; i++) {
                  if (category['label' + i] && category['label' + i].toLowerCase() === postData.category.toLowerCase().trim()){
                    $scope.idCategory =  category.id;
                  }
                }
              });
              postData.category = $scope.idCategory;
            }
          }

          if (postData['tags']) {
            var tag = postData.tags.toString().split("/");
            var tagsId = [];
            tag.forEach(function(tag){
              $scope.getTags.filter(function(tags){
                for (var i = 1; i <=4; i++) {
                  if (tags['label' + i] && tags['label' + i].toLowerCase() === tag.toLowerCase().trim()){
                    tagsId.push(tags.id);
                  }
                }
              });
            });
            postData.tags = tagsId;
          }
        });

        $mdDialog.hide($scope.importData);

      };

      $scope.toggleGuide = function () {
          $scope.guideVisible = !$scope.guideVisible;
      };

      $scope.cancel = function() {
      $mdDialog.cancel();
      };
    }
})();
