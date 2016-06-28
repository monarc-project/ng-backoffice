(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'AssetService', 'ThreatService', 'VulnService', 'AmvService', 'MeasureService', 'ObjlibService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                  AssetService, ThreatService, VulnService, AmvService, MeasureService, ObjlibService) {
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



        /*
         * ASSETS TAB
         */
        $scope.assets = TableHelperService.build('-label1', 10, 1, '');
        $scope.assets.activeFilter = 1;
        $scope.$watch('assets.activeFilter', function() { $scope.updateAssets(); });

        $scope.selectAssetsTab = function () {
            TableHelperService.watchSearch($scope, 'assets.query.filter', $scope.assets.query, $scope.updateAssets, $scope.assets);
        };

        $scope.deselectAssetsTab = function () {
            TableHelperService.unwatchSearch($scope.assets);
        };

        $scope.updateAssets = function () {
            var query = angular.copy($scope.assets.query);
            query.status = $scope.assets.activeFilter;

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
            AssetService.getAsset(asset.id).then(function (asset_db) {
                asset_db.status = !asset_db.status;

                if (asset_db.models && asset_db.models.length > 0) {
                    var modelIds = [];
                    for (var i = 0; i < asset_db.models.length; ++i) {
                        modelIds.push(asset_db.models[i].id);
                    }
                    asset_db.models = modelIds;
                }

                AssetService.updateAsset(asset_db, function () {
                    asset.status = !asset.status;
                });

            })


        }

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

                            if (asset.mode == 1 && asset.models.length > 0) {
                                // If we create a generic asset, but we still have specific models, we should warn
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The asset has been created successfully, however without models, the element may not be specific.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            } else {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The asset has been created successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The asset has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The asset "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteAssetMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset(s)?',
                    {count: $scope.assets.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.assets.selected, function (value, key) {
                    AssetService.deleteAsset(value.id,
                        function () {
                            $scope.updateAssets();
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
        $scope.threats = TableHelperService.build('-label1', 10, 1, '');

        $scope.selectThreatsTab = function () {
            TableHelperService.watchSearch($scope, 'threats.query.filter', $scope.threats.query, $scope.updateThreats, $scope.threats);
        };

        $scope.deselectThreatsTab = function () {
            TableHelperService.unwatchSearch($scope.threats);
        };

        $scope.updateThreats = function () {
            $scope.threats.promise = ThreatService.getThreats($scope.threats.query);
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
            ThreatService.getThreat(threat.id).then(function (threat_db) {
                threat_db.status = !threat_db.status;

                if (threat_db.models && threat_db.models.length > 0) {
                    var modelIds = [];
                    for (var i = 0; i < threat_db.models.length; ++i) {
                        modelIds.push(threat_db.models[i].id);
                    }
                    threat_db.models = modelIds;
                }
                if (threat_db.theme) {
                    threat_db.theme = threat_db.theme.id;
                }

                ThreatService.updateThreat(threat_db, function () {
                    threat.status = !threat.status;
                });

            })


        }

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
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The threat has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The threat has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The threat "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteThreatMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected threat(s)?',
                    {count: $scope.threats.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.threats.selected, function (value, key) {
                    ThreatService.deleteThreat(value.id,
                        function () {
                            $scope.updateThreats();
                        }
                    );
                });

                $scope.threats.selected = [];

            });
        };

        /*
         * VULNS TAB
         */
        $scope.vulns = TableHelperService.build('-label1', 10, 1, '');

        $scope.selectVulnsTab = function () {
            TableHelperService.watchSearch($scope, 'vulns.query.filter', $scope.vulns.query, $scope.updateVulns, $scope.vulns);
        };

        $scope.deselectVulnsTab = function () {
            TableHelperService.unwatchSearch($scope.vulns);
        };

        $scope.updateVulns = function () {
            $scope.vulns.promise = VulnService.getVulns($scope.vulns.query);
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
            VulnService.getVuln(vuln.id).then(function (vuln_db) {
                vuln_db.status = !vuln_db.status;

                if (vuln_db.models && vuln_db.models.length > 0) {
                    var modelIds = [];
                    for (var i = 0; i < vuln_db.models.length; ++i) {
                        modelIds.push(vuln_db.models[i].id);
                    }
                    vuln_db.models = modelIds;
                }

                VulnService.updateVuln(vuln_db, function () {
                    vuln.status = !vuln.status;
                });

            })
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
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The vulnerability has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The vulnerability has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                VulnService.deleteVuln(item.id,
                    function () {
                        $scope.updateVulns();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The vulnerability "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteVulnMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected vulnerabilites?',
                    {count: $scope.vulns.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.vulns.selected, function (value, key) {
                    VulnService.deleteVuln(value.id,
                        function () {
                            $scope.updateVulns();
                        }
                    );
                });

                $scope.vulns.selected = [];

            });
        };

        /*
         * 27002 MEASURES TAB
         */
        $scope.measures = TableHelperService.build('-description1', 10, 1, '');

        $scope.selectMeasuresTab = function () {
            TableHelperService.watchSearch($scope, 'measures.query.filter', $scope.measures.query, $scope.updateMeasures, $scope.measures);
        };

        $scope.deselectMeasuresTab = function () {
            TableHelperService.unwatchSearch($scope.measures);
        };

        $scope.updateMeasures = function () {
            $scope.measures.promise = MeasureService.getMeasures($scope.measures.query);
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
            MeasureService.getMeasure(measure.id).then(function (measure_db) {
                measure_db.status = !measure_db.status;

                if (measure_db.models && measure_db.models.length > 0) {
                    var modelIds = [];
                    for (var i = 0; i < measure_db.models.length; ++i) {
                        modelIds.push(measure_db.models[i].id);
                    }
                    measure_db.models = modelIds;
                }

                MeasureService.updateMeasure(measure_db, function () {
                    measure.status = !measure.status;
                });

            })
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
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The measure has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The measure has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The measure "{{label}}" has been deleted.',
                                    {label: item.description1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteMeasureMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected measures?',
                    {count: $scope.measures.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.measures.selected, function (value, key) {
                    MeasureService.deleteMeasure(value.id,
                        function () {
                            $scope.updateMeasures();
                        }
                    );
                });

                $scope.measures.selected = [];

            });
        };

        /*
         * AMVS TAB
         */
        $scope.amvs = TableHelperService.build('-status', 10, 1, '');

        $scope.selectAmvsTab = function () {
            TableHelperService.watchSearch($scope, 'amvs.query.filter', $scope.amvs.query, $scope.updateAmvs, $scope.amvs);
        };

        $scope.deselectAmvsTab = function () {
            TableHelperService.unwatchSearch($scope.amvs);
        };

        $scope.updateAmvs = function () {
            $scope.amvs.promise = AmvService.getAmvs($scope.amvs.query);
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
            AmvService.getAmv(amv.id).then(function (amv_db) {
                amv_db.status = !amv_db.status;

                if (amv_db.asset) amv_db.asset = amv_db.asset.id;
                if (amv_db.threat) amv_db.threat = amv_db.threat.id;
                if (amv_db.vulnerability) amv_db.vulnerability = amv_db.vulnerability.id;
                if (amv_db.measure1) amv_db.measure1 = amv_db.measure1.id;
                if (amv_db.measure2) amv_db.measure2 = amv_db.measure2.id;
                if (amv_db.measure3) amv_db.measure3 = amv_db.measure3.id;

                AmvService.updateAmv(amv_db, function () {
                    amv.status = !amv.status;
                });

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
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The AMV has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The AMV has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The AMV "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteAmvMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected AMV link(s)?',
                    {count: $scope.amvs.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.amvs.selected, function (value, key) {
                    AmvService.deleteAmv(value.id,
                        function () {
                            $scope.updateAmvs();
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
        $scope.objlibs = TableHelperService.build('-name1', 10, 1, '');

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

        $scope.selectObjlibsTab = function () {
            objLibTabSelected = true;
            TableHelperService.watchSearch($scope, 'objlibs.query.filter', $scope.objlibs.query, $scope.updateObjlibs, $scope.objlibs);

            // Load all assets and categories to fill the md-select dropdowns
            AssetService.getAssets({order: '-code', limit: 0}).then(function (data) {
                $scope.objlib_assets = data.assets;
            });
            ObjlibService.getObjlibsCats({order: '-label1', limit: 0}).then(function (data) {
                var buildItemRecurse = function (children, depth) {
                    var output = [];

                    for (var i = 0; i < children.length; ++i) {
                        var child = children[i];

                        for (var j = 0; j < depth; ++j) {
                            child.label1 = " >> " + child.label1;
                        }

                        output.push(child);

                        if (child.child.length > 0) {
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
                controller: ['$scope', '$mdDialog', '$mdToast', 'gettext', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
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
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent(gettext('The object has been updated successfully.'))
                                            .position('top right')
                                            .hideDelay(3000)
                                    );
                                },

                                function () {
                                    $scope.createNewObjlib(ev, objlibBackup);
                                }
                            );
                        } else {
                            ObjlibService.createObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent(gettext('The object has been created successfully.'))
                                            .position('top right')
                                            .hideDelay(3000)
                                    );
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
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The object "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteObjlibMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected object(s)?',
                    {count: $scope.objlibs.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.objlibs.selected, function (value, key) {
                    ObjlibService.deleteObjlib(value.id,
                        function () {
                            $scope.updateObjlibs();
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
        ModelService.getModels().then(function (data) {
            $scope.models = data.models;
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();


        if (asset != undefined && asset != null) {
            $scope.asset = asset;
            var modelsIds = [];

            for (var i = 0; i < $scope.asset.models.length; ++i) {
                modelsIds.push($scope.asset.models[i].id);
            }

            $scope.asset.models = modelsIds;
        } else {
            $scope.asset = {
                mode: 1,
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
        ModelService.getModels().then(function (data) {
            $scope.models = data.models;
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.themeSearchText = '';

        if (threat != undefined && threat != null) {
            $scope.threat = threat;

            var modelsIds = [];

            for (var i = 0; i < $scope.threat.models.length; ++i) {
                modelsIds.push($scope.threat.models[i].id);
            }

            $scope.threat.models = modelsIds;

            $scope.threat.c = ($scope.threat.c == 1);
            $scope.threat.i = ($scope.threat.i == 1);
            $scope.threat.d = ($scope.threat.d == 1);

        } else {
            $scope.threat = {
                mode: 1,
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

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.threat);
        };
    }

    function CreateVulnDialogCtrl($scope, $mdDialog, ModelService, ConfigService, vuln) {
        ModelService.getModels().then(function (data) {
            $scope.models = data.models;
        });

        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (vuln != undefined && vuln != null) {
            $scope.vuln = vuln;

            var modelsIds = [];

            for (var i = 0; i < $scope.vuln.models.length; ++i) {
                modelsIds.push($scope.vuln.models[i].id);
            }

            $scope.vuln.models = modelsIds;
        } else {
            $scope.vuln = {
                mode: 1,
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
            ThreatService.getThreats({filter: query}).then(function (e) {
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
            VulnService.getVulns({filter: query}).then(function (e) {
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