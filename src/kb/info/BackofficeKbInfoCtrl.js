(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$stateParams', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'AssetService', 'ThreatService', 'VulnService', 'AmvService', 'MeasureService', 'ObjlibService', '$state',
            '$timeout',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $stateParams, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                  AssetService, ThreatService, VulnService, AmvService, MeasureService, ObjlibService,
                                  $state, $timeout) {
        $scope.tab = $stateParams.tab;
        $scope.gettext = gettext;
        TableHelperService.resetBookmarks();

        /*
         * Global helpers
         */

        $scope.specificityStr = function (type) {
            switch (type) {
                case 0: return gettext('Generic');
                case 1: return gettext('Specific');
            }
        };

        $scope.selectTab = function (tab) {
            switch (tab) {
                case 'assets': $scope.currentTabIndex = 0; break;
                case 'threats': $scope.currentTabIndex = 1; break;
                case 'vulns': $scope.currentTabIndex = 2; break;
                case 'measures': $scope.currentTabIndex = 3; break;
                case 'amvs': $scope.currentTabIndex = 4; break;
                case 'objlibs': $scope.currentTabIndex = 5; break;
            }
        }
        $scope.selectTab($scope.tab);

        $scope.$on('$locationChangeSuccess', function (event, newUrl) {
            var tabName = newUrl.substring(newUrl.lastIndexOf('/') + 1);
            $scope.tab = tabName;
            $scope.selectTab(tabName);
        });

        /*
         * ASSETS TAB
         */
        $scope.assets = TableHelperService.build('label1', 20, 1, '');
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
                templateUrl: '/views/dialogs/create.assets.html',
                targetEvent: ev,
                clickOutsideToClose: true,
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
                                toastr.warning(gettextCatalog.getString('The asset "{{assetLabel}}" has been created successfully, however without models, the element may not be specific.',
                                    {assetLabel: asset.label1}));
                            } else {
                                toastr.success(gettextCatalog.getString('The asset "{{assetLabel}}" has been created successfully.',
                                    {assetLabel: asset.label1}), gettext('Creation successful'));
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

            AssetService.getAsset(asset.id).then(function (assetData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'asset', CreateAssetDialogCtrl],
                    templateUrl: '/views/dialogs/create.assets.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
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
                                    toastr.warning(gettextCatalog.getString('The asset "{{assetLabel}}" has been updated successfully, however without models, the element may not be specific.',
                                        {assetLabel: asset.label1}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The asset "{{assetLabel}}" has been updated successfully.',
                                        {assetLabel: asset.label1}), gettext('Update successful'));
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
                .title(gettextCatalog.getString('Are you sure you want to delete asset "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AssetService.deleteAsset(item.id,
                    function () {
                        $scope.updateAssets();
                        toastr.success(gettextCatalog.getString('The asset "{{label}}" has been deleted.',
                                    {label: item.label1}), gettext('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteAssetMass = function (ev, item) {
            var count = $scope.assets.selected.length;
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset(s)?',
                    {count: count}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                var outpromise = null;

                angular.forEach($scope.assets.selected, function (value, key) {
                    AssetService.deleteAsset(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function() {
                                toastr.success(gettextCatalog.getString('{{count}} assets have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                                $scope.updateAssets();
                            }, 350);
                        }
                    );
                });

                $scope.assets.selected = [];

            });
        };

        $scope.assetTypeStr = function (type) {
            switch (type) {
                case 1: return gettext('Primary');
                case 2: return gettext('Secondary');
                case 3: return gettext('Virtual');
            }
        };

        /*
         * THREATS TAB
         */
        $scope.threats = TableHelperService.build('label1', 20, 1, '');
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
                controller: ['$scope', '$mdDialog', '$q', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
                templateUrl: '/views/dialogs/create.threats.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'threat': threat
                }
            })
                .then(function (threat) {
                    var themeBackup = threat.theme;

                    if (threat.theme) {
                        threat.theme = threat.theme.id;
                    }

                    ThreatService.createThreat(threat,
                        function () {
                            $scope.updateThreats();

                            if (threat.mode == 0 && threat.models && threat.models.length > 0) {
                                // If we create a generic threat, but we still have specific models, we should warn
                                toastr.warning(gettextCatalog.getString('The threat "{{threatLabel}}" has been created successfully, however without models, the element may not be specific.',
                                    {threatLabel: threat.label1}));
                            } else {
                                toastr.success(gettextCatalog.getString('The threat "{{threatLabel}}" has been created successfully.',
                                    {threatLabel: threat.label1}), gettext('Creation successful'));
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

            ThreatService.getThreat(threat.id).then(function (threatData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
                    templateUrl: '/views/dialogs/create.threats.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
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
                                    toastr.warning(gettextCatalog.getString('The threat "{{threatLabel}}" has been updated successfully, however without models, the element may not be specific.',
                                        {threatLabel: threat.label1}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The threat "{{threatLabel}}" has been updated successfully.',
                                        {threatLabel: threat.label1}), gettext('Update successful'));
                                }
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
                .title(gettextCatalog.getString('Are you sure you want to delete threat "{{ label }}"?',
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ThreatService.deleteThreat(item.id,
                    function () {
                        $scope.updateThreats();
                        toastr.success(gettextCatalog.getString('The threat "{{label}}" has been deleted.',
                                    {label: item.label}), gettext('Deletion successful'));
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
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.threats.selected, function (value, key) {
                    ThreatService.deleteThreat(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                $scope.updateThreats();
                                toastr.success(gettextCatalog.getString('{{count}} threats have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                            }, 350);
                        }
                    );
                });

                $scope.threats.selected = [];

            });
        };

        /*
         * VULNS TAB
         */
        $scope.vulns = TableHelperService.build('label1', 20, 1, '');
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
                templateUrl: '/views/dialogs/create.vulns.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'vuln': vuln
                }
            })
                .then(function (vuln) {
                    VulnService.createVuln(vuln,
                        function () {
                            $scope.updateVulns();

                            if (vuln.mode == 0 && vuln.models && vuln.models.length > 0) {
                                // If we create a generic vulnerability, but we still have specific models, we should warn
                                toastr.warning(gettextCatalog.getString('The vulnerability "{{vulnLabel}}" has been created successfully, however without models, the element may not be specific.',
                                    {vulnLabel: vuln.label1}));
                            } else {
                                toastr.success(gettextCatalog.getString('The vulnerability "{{vulnLabel}}" has been created successfully.',
                                    {vulnLabel: vuln.label1}), gettext('Creation successful'));
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

            VulnService.getVuln(vuln.id).then(function (vulnData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'vuln', CreateVulnDialogCtrl],
                    templateUrl: '/views/dialogs/create.vulns.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
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
                                    toastr.warning(gettextCatalog.getString('The vulnerability "{{vulnLabel}}" has been updated successfully, however without models, the element may not be specific.',
                                        {vulnLabel: vuln.label1}));
                                } else {
                                    toastr.success(gettextCatalog.getString('The vulnerability "{{vulnLabel}}" has been updated successfully.',
                                        {vulnLabel: vuln.label1}), gettext('Update successful'));
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
                .title(gettextCatalog.getString('Are you sure you want to delete vulnerability "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                VulnService.deleteVuln(item.id,
                    function () {
                        $scope.updateVulns();
                        toastr.success(gettextCatalog.getString('The vulnerability "{{label}}" has been deleted.',
                                    {label: item.label1}), gettext('Deletion successful'));
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
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.vulns.selected, function (value, key) {
                    VulnService.deleteVuln(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                $scope.updateVulns();
                                toastr.success(gettextCatalog.getString('{{count}} vulnerabilities have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                            }, 350);
                        }
                    );
                });

                $scope.vulns.selected = [];

            });
        };

        /*
         * 27002 MEASURES TAB
         */
        $scope.measures = TableHelperService.build('description1', 20, 1, '');
        $scope.measures.activeFilter = 1;
        var measuresFilterWatch;

        $scope.selectMeasuresTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'measures'});
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

        $scope.deselectMeasuresTab = function () {
            TableHelperService.unwatchSearch($scope.measures);
        };

        $scope.updateMeasures = function () {
            var query = angular.copy($scope.measures.query);
            query.status = $scope.measures.activeFilter;

            if ($scope.measures.previousQueryOrder != $scope.measures.query.order) {
                $scope.measures.query.page = query.page = 1;
                $scope.measures.previousQueryOrder = $scope.measures.query.order;
            }

            $scope.measures.promise = MeasureService.getMeasures(query);
            $scope.measures.promise.then(
                function (data) {
                    $scope.measures.items = data;
                }
            )
        };
        $scope.removeMeasuresFilter = function () {
            TableHelperService.removeFilter($scope.vulns);
        };


        $scope.toggleMeasureStatus = function (measure) {
            MeasureService.patchMeasure(measure.id, {status: !measure.status}, function () {
                measure.status = !measure.status;
            });
        }


        $scope.createNewMeasure = function (ev, measure) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'measure', CreateMeasureDialogCtrl],
                templateUrl: '/views/dialogs/create.measures.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'measure': measure
                }
            })
                .then(function (measure) {
                    MeasureService.createMeasure(measure,
                        function () {
                            $scope.updateMeasures();
                            toastr.success(gettextCatalog.getString('The measure "{{measureLabel}}" has been created successfully.',
                                {measureLabel: measure.description1}), gettext('Creation successful'));
                        },

                        function (err) {
                            $scope.createNewMeasure(ev, measure);
                        }
                    );
                });
        };

        $scope.editMeasure = function (ev, measure) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            MeasureService.getMeasure(measure.id).then(function (measureData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'measure', CreateMeasureDialogCtrl],
                    templateUrl: '/views/dialogs/create.measures.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'measure': measureData
                    }
                })
                    .then(function (measure) {
                        MeasureService.updateMeasure(measure,
                            function () {
                                $scope.updateMeasures();
                                toastr.success(gettextCatalog.getString('The measure "{{measureLabel}}" has been updated successfully.',
                                    {measureLabel: measure.description1}), gettext('Update successful'));
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
                .title(gettextCatalog.getString('Are you sure you want to delete measure "{{ label }}"?',
                    {label: item.description1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                MeasureService.deleteMeasure(item.id,
                    function () {
                        $scope.updateMeasures();
                        toastr.success(gettextCatalog.getString('The measure "{{label}}" has been deleted.',
                                    {label: item.description1}), gettext('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteMeasureMass = function (ev, item) {
            var outpromise = null;
            var count = $scope.measures.selected.length;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected measures?',
                    {count: count}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.measures.selected, function (value, key) {
                    MeasureService.deleteMeasure(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                $scope.updateMeasures();
                                toastr.success(gettextCatalog.getString('{{count}} measures have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                            }, 350)

                        }
                    );
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

        $scope.selectAmvsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'amvs'});
            var initAmvsFilter = true;
            initAmvsFilter = $scope.$watch('amvs.activeFilter', function() {
                if (initAmvsFilter) {
                    initAmvsFilter = false;
                } else {
                    $scope.updateAmvs();
                }
            });

            TableHelperService.watchSearch($scope, 'amvs.query.filter', $scope.amvs.query, $scope.updateAmvs, $scope.amvs);
        };

        $scope.deselectAmvsTab = function () {
            TableHelperService.unwatchSearch($scope.amvs);
        };

        $scope.updateAmvs = function () {
            var query = angular.copy($scope.amvs.query);
            query.status = $scope.amvs.activeFilter;

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
                controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'ConfigService', '$q', 'amv', CreateAmvDialogCtrl],
                templateUrl: '/views/dialogs/create.amvs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'amv': amv
                }
            })
                .then(function (amv) {
                    var amvBackup = angular.copy(amv);

                    if (amv.measure1) {
                        amv.measure1 = amv.measure1.id;
                    }
                    if (amv.measure2) {
                        amv.measure2 = amv.measure2.id;
                    }
                    if (amv.measure3) {
                        amv.measure3 = amv.measure3.id;
                    }
                    if (amv.threat) {
                        amv.threat = amv.threat.id;
                    }
                    if (amv.asset) {
                        amv.asset = amv.asset.id;
                    }
                    if (amv.vulnerability) {
                        amv.vulnerability = amv.vulnerability.id;
                    }

                    AmvService.createAmv(amv,
                        function () {
                            $scope.updateAmvs();
                            toastr.success(gettext('The AMV link has been created successfully.'), gettext('Creation successful'));
                        },

                        function () {
                            $scope.createNewAmv(ev, amvBackup);
                        }
                    );
                });
        };

        $scope.editAmv = function (ev, amv) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            AmvService.getAmv(amv.id).then(function (amvData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'ConfigService', '$q', 'amv', CreateAmvDialogCtrl],
                    templateUrl: '/views/dialogs/create.amvs.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'amv': amvData
                    }
                })
                    .then(function (amv) {
                        var amvBackup = angular.copy(amv);
                        if (amv.measure1) {
                            amv.measure1 = amv.measure1.id;
                        }
                        if (amv.measure2) {
                            amv.measure2 = amv.measure2.id;
                        }
                        if (amv.measure3) {
                            amv.measure3 = amv.measure3.id;
                        }
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
                                toastr.success(gettext('The AMV link has been updated successfully.'), gettext('Update successful'));
                            },

                            function () {
                                $scope.editAmv(ev, amvBackup);
                            }
                        );
                    });
            });
        };

        $scope.deleteAmv = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete this AMV link?'))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AmvService.deleteAmv(item.id,
                    function () {
                        $scope.updateAmvs();
                        toastr.success(gettextCatalog.getString('The AMV link has been deleted.'), gettext('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteAmvMass = function (ev, item) {
            var count = $scope.amvs.selected.length;
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected AMV link(s)?',
                    {count: count}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.amvs.selected, function (value, key) {
                    AmvService.deleteAmv(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                toastr.success(gettextCatalog.getString('{{ count }} AMV links have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                                $scope.updateAmvs();
                            }, 350);

                        }
                    );
                });

                $scope.amvs.selected = [];

            }, function() {
            });
        };

        /*
         * OBJECTS LIBRARY TAB
         */
        var objLibTabSelected = false;
        $scope.objlibs = TableHelperService.build('name1', 20, 1, '');

        $scope.objlib_category_filter = 0;
        $scope.objlib_asset_filter = 0;
        $scope.objlib_lockswitch = false;
        $scope.objlib_assets = [];

        $scope.$watchGroup(['objlib_category_filter', 'objlib_asset_filter', 'objlib_lockswitch'], function (newValue, oldValue) {
            if (objLibTabSelected) {
                // Refresh contents
                $scope.updateObjlibs();
            }
        });

        $scope.objlibAssetTypeStr = function (type) {
            if (type == 'bdc') {
                return gettext('Knowledge base');
            } else if (type == 'anr') {
                return gettext('Risk analysis');
            } else {
                return type;
            }
        }

        $scope.objlibScopeStr = function (scope) {
            switch (scope) {
                case 1: return gettext('Local');
                case 2: return gettext('Global');
                default: return scope;
            }
        }

        $scope.resetObjlibsFilters = function () {
            $scope.objlib_category_filter = 0;
            $scope.objlib_asset_filter = 0;
            $scope.objlib_lockswitch = false;
        };

        $scope.selectCategoryFilter = function (id) {
            $scope.objlib_category_filter = id;
        };

        $scope.selectObjlibsTab = function () {
            $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'objlibs'});
            objLibTabSelected = true;
            TableHelperService.watchSearch($scope, 'objlibs.query.filter', $scope.objlibs.query, $scope.updateObjlibs, $scope.objlibs);

            // Load all assets and categories to fill the md-select dropdowns
            AssetService.getAssets({order: '-code', limit: 0}).then(function (data) {
                $scope.objlib_assets = data.assets;
            });
            ObjlibService.getObjlibsCats({limit: 0}).then(function (data) {
                var buildItemRecurse = function (children, depth) {
                    var output = [];

                    for (var i = 0; i < children.length; ++i) {
                        var child = children[i];

                        for (var j = 0; j < depth; ++j) {
                            child.label1 = " >> " + child.label1;
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

        $scope.deselectObjlibsTab = function () {
            objLibTabSelected = false;
            TableHelperService.unwatchSearch($scope.objlibs);
        };

        $scope.updateObjlibs = function () {
            var query = angular.copy($scope.objlibs.query);
            if ($scope.objlib_category_filter > 0) {
                query.category = $scope.objlib_category_filter;
            }
            if ($scope.objlib_asset_filter > 0) {
                query.asset = $scope.objlib_asset_filter;
            }
            query.lock = $scope.objlib_lockswitch;

            if ($scope.objlibs.previousQueryOrder != $scope.objlibs.query.order) {
                $scope.objlibs.query.page = query.page = 1;
                $scope.objlibs.previousQueryOrder = $scope.objlibs.query.order;
            }

            $scope.objlibs.promise = ObjlibService.getObjlibs(query);
            $scope.objlibs.promise.then(
                function (data) {
                    $scope.objlibs.items = data;
                }
            )
        };

        $scope.removeObjlibsFilter = function () {
            TableHelperService.removeFilter($scope.objlibs);
        };

        $scope.createNewObjlib = function (ev, objlib) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var isUpdate = (objlib && objlib.id);

            $scope.objLibDialog = $mdDialog;
            $scope.objLibDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'gettextCatalog', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'mode', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    mode: 'bdc',
                    objLibDialog: $scope,
                    objlib: objlib
                }
            })
                .then(function (objlib) {
                    if (objlib) {
                        var objlibBackup = angular.copy(objlib);

                        if (objlib.asset) {
                            objlib.asset = objlib.asset.id;
                        }

                        if (objlib.rolfTag) {
                            objlib.rolfTag = objlib.rolfTag.id;
                        }

                        if (objlib.category) {
                            objlib.category = objlib.category.id;
                        }

                        if (isUpdate) {
                            ObjlibService.updateObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    toastr.success(gettextCatalog.getString('The object "{{objlibLabel}}" has been updated successfully.',
                                        {objlibLabel: objlib.label1}), gettext('Update successful'));
                                },

                                function () {
                                    $scope.createNewObjlib(ev, objlibBackup);
                                }
                            );
                        } else {
                            ObjlibService.createObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    toastr.success(gettextCatalog.getString('The object "{{objlibLabel}}" has been created successfully.',
                                        {objlibLabel: objlib.label1}), gettext('Creation successful'));
                                },

                                function () {
                                    $scope.createNewObjlib(ev, objlibBackup);
                                }
                            );
                        }
                    }
                });
        };

        $scope.editObjlib = function (ev, objlib) {
            if (objlib && objlib.id) {
                ObjlibService.getObjlib(objlib.id).then(function (objlibData) {
                    $scope.createNewObjlib(ev, objlibData);
                });
            } else {
                $scope.createNewObjlib(ev, objlib);
            }
        };

        $scope.deleteObjlib = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete object "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ObjlibService.deleteObjlib(item.id,
                    function () {
                        $scope.updateObjlibs();
                        toastr.success(gettextCatalog.getString('The object "{{label}}" has been deleted.',
                                    {label: item.label1}), gettext('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteObjlibMass = function (ev, item) {
            var count = $scope.objlibs.selected.length;
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected object(s)?',
                    {count: count}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.objlibs.selected, function (value, key) {
                    ObjlibService.deleteObjlib(value.id,
                        function () {
                            if (outpromise) {
                                $timeout.cancel(outpromise);
                            }

                            outpromise = $timeout(function () {
                                toastr.success(gettextCatalog.getString('{{count}} objects have been deleted.',
                                    {count: count}), gettext('Deletion successful'));
                                $scope.updateObjlibs();
                            }, 350);
                        }
                    );
                });

                $scope.objlibs.selected = [];

            }, function() {
            });
        };
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
                type: 1,
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

    function CreateThreatDialogCtrl($scope, $mdDialog, $q, ModelService, ThreatService, ConfigService, threat) {
        ModelService.getModels({isGeneric:0}).then(function (data) {
            $scope.models = data.models;
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
            $scope.threat.d = ($scope.threat.d == 1);

        } else {
            $scope.threat = {
                mode: 0,
                code: '',
                c: false,
                i: false,
                d: false,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                descAccidental1: '',
                descAccidental2: '',
                descAccidental3: '',
                descAccidental4: '',
                exAccidental1: '',
                exAccidental2: '',
                exAccidental3: '',
                exAccidental4: '',
                descDeliberate1: '',
                descDeliberate2: '',
                descDeliberate3: '',
                descDeliberate4: '',
                exDeliberate1: '',
                exDeliberate2: '',
                exDeliberate3: '',
                exDeliberate4: '',
                typeConsequences1: '',
                typeConsequences2: '',
                typeConsequences3: '',
                typeConsequences4: '',
            };
        }

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

        $scope.createTheme = function (label) {
            ThreatService.createTheme({label1: label}, function (data) {
                ThreatService.getTheme(data.id).then(function (theme) {
                    $scope.threat.theme = theme;
                })
            });
        };

        $scope.updateTheme = function (theme) {
            $scope.theme_edit_lock = true;
            ThreatService.updateTheme(theme, function () {
                ThreatService.getTheme(theme.id).then(function (theme) {
                    $scope.threat.theme = theme;
                    $scope.theme_edit_lock = false;
                    $scope.theme_edit = null;
                });
            });
        }

        $scope.deleteTheme = function (theme) {
            ThreatService.deleteTheme(theme.id, function () {
                $scope.threat.theme = null;
                $scope.theme_edit = null;
                $scope.themeSearchText = null;
            });
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.threat);
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
    }

    function CreateMeasureDialogCtrl($scope, $mdDialog, ConfigService, measure) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (measure != undefined && measure != null) {
            $scope.measure = measure;
        } else {
            $scope.measure = {
                code: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.measure);
        };
    }

    function CreateAmvDialogCtrl($scope, $mdDialog, AssetService, ThreatService, VulnService, MeasureService, ConfigService, $q, amv) {
        $scope.languages = ConfigService.getLanguages();
        $scope.defaultLang = ConfigService.getDefaultLanguageIndex();

        if (amv != undefined && amv != null) {
            $scope.amv = amv;
        } else {
            $scope.amv = {
                asset: null,
                threat: null,
                vulnerability: null,
                measure1: null,
                measure2: null,
                measure3: null,
                position: 1,
                status: 1
            };
        }

        // Asset
        $scope.queryAssetSearch = function (query) {
            var promise = $q.defer();
            AssetService.getAssets({filter: query}).then(function (e) {
                promise.resolve(e.assets);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedAssetItemChange = function (item) {
            if (item) {
                $scope.amv.asset = item;
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

        // Measures
        $scope.queryMeasureSearch = function (query) {
            var promise = $q.defer();
            MeasureService.getMeasures({filter: query}).then(function (e) {
                promise.resolve(e.measures);
            }, function (e) {
                promise.reject(e);
            });

            return promise.promise;
        };

        $scope.selectedMeasureItemChange = function (idx, item) {
            if (item) {
                $scope.amv['measure' + idx] = item;
            }
        }

        ////

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.amv);
        };
    }


})();
