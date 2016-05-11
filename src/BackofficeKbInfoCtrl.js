(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'AssetService', 'ThreatService', 'VulnService', 'AmvService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                  AssetService, ThreatService, VulnService, AmvService) {
        TableHelperService.resetBookmarks();

        /*
         * ASSETS TAB
         */
        $scope.assets = TableHelperService.build('label1', 10, 1, '');

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

        TableHelperService.watchSearch($scope, 'assets.query.filter', $scope.assets.query, $scope.updateAssets);

        $scope.createNewAsset = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', CreateAssetDialogCtrl],
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
                    controller: ['$scope', '$mdDialog', 'ModelService', 'asset', CreateAssetDialogCtrl],
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
        $scope.threats = TableHelperService.build('label', 10, 1, '');

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

        TableHelperService.watchSearch($scope, 'threats.query.filter', $scope.threats.query, $scope.updateThreats);

        $scope.createNewThreat = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ThreatService', CreateThreatDialogCtrl],
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
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ThreatService', 'threat', CreateThreatDialogCtrl],
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
        $scope.vulns = TableHelperService.build('label', 10, 1, '');

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

        TableHelperService.watchSearch($scope, 'vulns.query.filter', $scope.vulns.query, $scope.updateVulns);

        $scope.createNewVuln = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', CreateVulnDialogCtrl],
                templateUrl: '/views/dialogs/create.vulns.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (vuln) {
                    VulnService.createVuln(vuln).then(
                        function () {
                            $scope.updateVulns();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The vuln has been created successfully.'))
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
                    controller: ['$scope', '$mdDialog', 'ModelService', 'vuln', CreateVulnDialogCtrl],
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
                                        .textContent(gettext('The vuln has been updated successfully.'))
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
         * AMVS TAB
         */
        $scope.amvs = TableHelperService.build('label', 10, 1, '');

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

        TableHelperService.watchSearch($scope, 'amvs.query.filter', $scope.amvs.query, $scope.updateAmvs);

        $scope.createNewAmv = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', CreateAmvDialogCtrl],
                templateUrl: '/views/dialogs/create.amvs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (amv) {
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
                    controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'amv', CreateAmvDialogCtrl],
                    templateUrl: '/views/dialogs/create.amvs.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'amv': amvData
                    }
                })
                    .then(function (amv) {
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
                .title(gettextCatalog.getString('Are you sure you want to delete amverability "{{ label }}"?',
                    {label: item.label}))
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
    }


    //////////////////////
    // DIALOGS
    //////////////////////

    function CreateAssetDialogCtrl($scope, $mdDialog, ModelService, asset) {
        ModelService.getModels().then(function (data) {
            $scope.models = data.models;
        });

        $scope.language = 1;

        if (asset != undefined && asset != null) {
            $scope.asset = asset;
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
                description4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.asset);
        };
    }

    function CreateThreatDialogCtrl($scope, $mdDialog, ModelService, ThreatService, threat) {
        ModelService.getModels().then(function (data) {
            $scope.models = data;
        });

        $scope.language = 1;
        $scope.themeSearchText = '';

        if (threat != undefined && threat != null) {
            $scope.threat = threat;
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
            $scope.threat.threat_theme_id = item.id;
        }

        $scope.createTheme = function (label) {
            return ThreatService.createTheme(label);
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.threat);
        };
    }

    function CreateVulnDialogCtrl($scope, $mdDialog, ModelService, vuln) {
        ModelService.getModels().then(function (data) {
            $scope.models = data;
        });

        $scope.language = 1;

        if (vuln != undefined && vuln != null) {
            $scope.vuln = vuln;
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

    function CreateAmvDialogCtrl($scope, $mdDialog, AssetService, ThreatService, VulnService, amv) {
        $scope.language = 1;

        if (amv != undefined && amv != null) {
            $scope.amv = amv;
        } else {
            $scope.amv = {
                asset_id: null,
                threat_id: null,
                vulnerability_id: null,
                measure1_id: null,
                measure2_id: null,
                measure3_id: null
            };
        }

        $scope.queryAssetSearch = function (query) {
            return AssetService.getAssets({filter: query});
        };

        $scope.selectedAssetItemChange = function (item) {
            $scope.amv.asset_id = item.id;
        }

        $scope.queryThreatSearch = function (query) {
            return ThreatService.getThreats({filter: query});
        };

        $scope.selectedThreatItemChange = function (item) {
            $scope.amv.threat_id = item.id;
        }

        $scope.queryVulnSearch = function (query) {
            return VulnService.getVulns({filter: query});
        };

        $scope.selectedThreatItemChange = function (item) {
            $scope.amv.vulnerability_id = item.id;
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.amv);
        };
    }
})();