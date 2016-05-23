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
        TableHelperService.resetBookmarks();

        /*
         * ASSETS TAB
         */
        $scope.assets = TableHelperService.build('label1', 10, 1, '');

        $scope.selectAssetsTab = function () {
            TableHelperService.watchSearch($scope, 'assets.query.filter', $scope.assets.query, $scope.updateAssets, $scope.assets);
        };

        $scope.deselectAssetsTab = function () {
            TableHelperService.unwatchSearch($scope.assets);
        };

        $scope.updateAssets = function () {
            $scope.assets.promise = AssetService.getAssets($scope.assets.query);
            $scope.assets.promise.then(
                function (data) {
                    $scope.assets.items = data;
                }
            )
        };
        $scope.removeAssetsFilter = function () {
            TableHelperService.removeFilter($scope.assets);
        };

        $scope.createNewAsset = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', CreateAssetDialogCtrl],
                templateUrl: '/views/dialogs/create.assets.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (asset) {


                    AssetService.createAsset(asset,
                        function () {
                            $scope.updateAssets();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The asset has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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

        $scope.assetModeStr = function (type) {
            switch (type) {
                case 1: return gettext('Generic');
                case 2: return gettext('Specific');
            }
        };



        /*
         * THREATS TAB
         */
        $scope.threats = TableHelperService.build('label1', 10, 1, '');

        $scope.selectThreatsTab = function () {
            TableHelperService.watchSearch($scope, 'threats.query.filter', $scope.threats.query, $scope.updateThreats, $scope.threats);
        };

        $scope.deselectThreatsTab = function () {
            TableHelperService.unwatchSearch($scope.threats);
        };

        $scope.getThreatModeString = function (mode) {
            switch (mode) {
                case 1:
                    return gettext("Generic");

                case 2:
                    return gettext("Specific");
            }
        }

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

        $scope.createNewThreat = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ThreatService', 'ConfigService', CreateThreatDialogCtrl],
                templateUrl: '/views/dialogs/create.threats.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (threat) {
                    ThreatService.createThreat(threat,
                        function () {
                            $scope.updateThreats();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The threat has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editThreat = function (ev, threat) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ThreatService.getThreat(threat.id).then(function (threatData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
                    templateUrl: '/views/dialogs/create.threats.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'threat': threatData
                    }
                })
                    .then(function (threat) {
                        ThreatService.updateThreat(threat,
                            function () {
                                $scope.updateThreats();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The threat has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
        $scope.vulns = TableHelperService.build('label1', 10, 1, '');

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

        $scope.getVulnModeString = function (mode) {
            switch (mode) {
                case 1:
                    return gettext("Generic");

                case 2:
                    return gettext("Specific");
            }
        }


        $scope.createNewVuln = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', CreateVulnDialogCtrl],
                templateUrl: '/views/dialogs/create.vulns.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
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
        $scope.measures = TableHelperService.build('description1', 10, 1, '');

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


        $scope.createNewMeasure = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', CreateMeasureDialogCtrl],
                templateUrl: '/views/dialogs/create.measures.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
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
                            }
                        );
                    });
            });
        };

        $scope.deleteMeasure = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete measure "{{ label }}"?',
                    {label: item.label}))
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
                                    {label: item.label}))
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
        $scope.amvs = TableHelperService.build('status', 10, 1, '');

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

        $scope.createNewAmv = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'ConfigService', '$q', CreateAmvDialogCtrl],
                templateUrl: '/views/dialogs/create.amvs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (amv) {
                    amv.measure1 = amv.measure1.id;
                    amv.measure2 = amv.measure2.id;
                    amv.measure3 = amv.measure3.id;
                    amv.threat = amv.threat.id;
                    amv.asset = amv.asset.id;
                    amv.vulnerability = amv.vulnerability.id;


                    AmvService.createAmv(amv,
                        function () {
                            $scope.updateAmvs();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The AMV has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
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
                        amv.measure1 = amv.measure1.id;
                        amv.measure2 = amv.measure2.id;
                        amv.measure3 = amv.measure3.id;
                        amv.threat = amv.threat.id;
                        amv.asset = amv.asset.id;
                        amv.vulnerability = amv.vulnerability.id;

                        AmvService.updateAmv(amv,
                            function () {
                                $scope.updateAmvs();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The AMV has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
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
        $scope.objlibs = TableHelperService.build('status', 10, 1, '');

        $scope.selectObjlibsTab = function () {
            TableHelperService.watchSearch($scope, 'objlibs.query.filter', $scope.objlibs.query, $scope.updateObjlibs, $scope.objlibs);
        };

        $scope.deselectObjlibsTab = function () {
            TableHelperService.unwatchSearch($scope.objlibs);
        };

        $scope.updateObjlibs = function () {
            $scope.objlibs.promise = ObjlibService.getObjlibs($scope.objlibs.query);
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
                    objlib.asset = objlib.asset.id;
                    objlib.rolfTag = objlib.rolfTag.id;

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
                            }
                        );
                    }
                });
        };

        $scope.editObjlib = function (ev, objlib) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

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
            $mdDialog.hide($scope.asset);
        };
    }

    function CreateThreatDialogCtrl($scope, $mdDialog, ModelService, ThreatService, ConfigService, threat) {
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
                desc_accidental1: '',
                desc_accidental2: '',
                desc_accidental3: '',
                desc_accidental4: '',
                ex_accidental1: '',
                ex_accidental2: '',
                ex_accidental3: '',
                ex_accidental4: '',
                desc_deliberate1: '',
                desc_deliberate2: '',
                desc_deliberate3: '',
                desc_deliberate4: '',
                ex_deliberate1: '',
                ex_deliberate2: '',
                ex_deliberate3: '',
                ex_deliberate4: '',
                type_consequences1: '',
                type_consequences2: '',
                type_consequences3: '',
                type_consequences4: '',
            };
        }

        $scope.queryThemeSearch = function (query) {
            return ThreatService.getThemes({filter: query});
        };

        $scope.selectedThemeItemChange = function (item) {
            $scope.threat.threatTheme = item;
        }

        $scope.createTheme = function (label) {
            return ThreatService.createTheme({label1: label});
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
        $scope.queryMeasureSearch = function (idx, query) {
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

    function CreateObjlibDialogCtrl($scope, $mdDialog, $mdToast, gettext, AssetService, ObjlibService, ConfigService, TagService, $q, objLibDialog, objlib) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.assetSearchText = '';

        if (objlib != undefined && objlib != null) {
            $scope.objlib = objlib;
        } else {
            $scope.objlib = {
                mode: 1,
                scope: 1,
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                name1: '',
                name2: '',
                name3: '',
                name4: ''
            };
        }

        $scope.queryAssetSearch = function (query) {
            var q = $q.defer();

            AssetService.getAssets({filter: query}).then(function (x) {
                q.resolve(x.assets);
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedAssetItemChange = function (item) {
            $scope.objlib.asset = item;
        };

        $scope.createCategory = function (ev, catName) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'catName', CreateObjlibCategoryDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.categories.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {
                    'catName': catName
                }
            })
                .then(function (category) {
                    ObjlibService.createObjlibCat(category,
                        function () {
                            $scope.updateMeasures();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The category has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                    objLibDialog.editObjlib(null, $scope.objlib);
                }, function () {
                    objLibDialog.editObjlib(null, $scope.objlib);
                });
        };

        $scope.queryCategorySearch = function (query) {
            var q = $q.defer();

            ObjlibService.getObjlibsCats({filter: query}).then(function (x) {
                if (x && x.categories) {
                    q.resolve(x.categories);
                } else {
                    q.reject();
                }
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedCategoryItemChange = function (item) {
            $scope.objlib.objectCategory = item;
        };

        $scope.queryTagSearch = function (query) {
            var q = $q.defer();

            TagService.getTags({filter: query}).then(function (x) {
                q.resolve(x.tags);
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedTagItemChange = function (item) {
            $scope.objlib.rolfTag = item;
        };


        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.objlib);
        };
    }

    function CreateObjlibCategoryDialogCtrl($scope, $mdDialog, ConfigService, catName, category) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (category != undefined && category != null) {
            $scope.category = category;
        } else {
            $scope.category = {
                parent: null,
                position: null,
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
    }
})();