(function() {

	angular
		.module('BackofficeApp')
		.directive('onReadFile', ['$parse', '$mdDialog', 'gettextCatalog', function($parse, $mdDialog, gettextCatalog) {

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
								if (isJson) {
									fn(scope, {
										$fileContent: JSON.parse(data)
									});
								} else if (isCsv) {
									fn(scope, {
										$fileContent: data
									});
								} else {
									var workbook = XLSX.read(data, {
										type: 'binary'
									});
									var sheetName = workbook.SheetNames[0];
									if (workbook.Sheets[sheetName].hasOwnProperty('!ref')) {
										var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
										var chartset = jschardet.detect(csv);
										if (chartset.encoding == 'UTF-8') {
											fn(scope, {
												$fileContent: decodeURIComponent(escape(csv))
											});
										} else {
											fn(scope, {
												$fileContent: csv
											});
										}
									}
								}
							});
						};
						var fileTypes = ['json', 'csv', 'xlsx', 'xls']; // File types supported
						var extension = onChangeEvent.target.files[0].name.split('.').pop().toLowerCase(); //Extract extension of file
						var isSuccess = fileTypes.indexOf(extension) > -1; // Check file type
						var size = onChangeEvent.target.files[0].size < 1e6; // Check fize size being less 1M

						if (isSuccess && size) {
							var isJson = isCsv = false;
							if (extension == "json") {
								reader.readAsText(onChangeEvent.target.files[0]);
								isJson = true;
							} else if (extension == "csv") {
								reader.readAsText(onChangeEvent.target.files[0]);
								isCsv = true;
							} else {
								reader.readAsBinaryString(onChangeEvent.target.files[0]);
							}
						} else {
							var alert = $mdDialog.alert()
								.multiple(true)
								.title(gettextCatalog.getString('File error'))
								.textContent(gettextCatalog.getString('File type not supported'))
								.theme('light')
								.ok(gettextCatalog.getString('Cancel'))
							$mdDialog.show(alert);
						}
						onChangeEvent.target.value = null;
					});
				}
			};
		}])
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

		$scope.specificityStr = function(type) {
			switch (type) {
				case 0:
					return gettextCatalog.getString('Generic');
				case 1:
					return gettextCatalog.getString('Specific');
			}
		};

		$scope.selectTab = function(tab) {
			switch (tab) {
				case 'assets':
					$scope.currentTabIndex = 0;
					break;
				case 'threats':
					$scope.currentTabIndex = 1;
					break;
				case 'vulns':
					$scope.currentTabIndex = 2;
					break;
				case 'measures':
					$scope.currentTabIndex = 3;
					break;
				case 'categories':
					$scope.currentTabIndex = 4;
					break;
				case 'amvs':
					$scope.currentTabIndex = 5;
					break;
				case 'objlibs':
					$scope.currentTabIndex = 6;
					break;
			}
		}
		$scope.selectTab($scope.tab);

		$scope.$on('$locationChangeSuccess', function(event, newUrl) {
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

		$scope.selectAssetsTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'assets'
			});
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

		$scope.deselectAssetsTab = function() {
			assetsFilterWatch();
			TableHelperService.unwatchSearch($scope.assets);
			$scope.assets.selected = [];
		};

		$scope.updateAssets = function() {
			var query = angular.copy($scope.assets.query);
			query.status = $scope.assets.activeFilter;

			if ($scope.assets.previousQueryOrder != $scope.assets.query.order) {
				$scope.assets.query.page = query.page = 1;
				$scope.assets.previousQueryOrder = $scope.assets.query.order;
			}

			$scope.assets.promise = AssetService.getAssets(query);
			$scope.assets.promise.then(
				function(data) {
					$scope.assets.items = data;
				}
			)
		};

		$scope.removeAssetsFilter = function() {
			TableHelperService.removeFilter($scope.assets);
		};

		$scope.toggleAssetStatus = function(asset) {
			AssetService.patchAsset(asset.uuid, {
				status: !asset.status
			}, function() {
				asset.status = !asset.status;
			});
		};

		$scope.createNewAsset = function(ev, asset) {
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
				.then(function(asset) {
					var cont = asset.cont;
					asset.cont = undefined;

					AssetService.createAsset(asset,
						function() {
							$scope.updateAssets();

							if (cont) {
								$scope.createNewAsset(ev);
							}

							if (asset.mode == 0 && asset.models && asset.models.length > 0) {
								// If we create a generic asset, but we still have specific models, we should warn
								toastr.warning(gettextCatalog.getString('The asset type has been created successfully, however without models, the element may not be specific.', {
									assetLabel: $scope._langField(asset, 'label')
								}));
							} else {
								toastr.success(gettextCatalog.getString('The asset type has been created successfully.', {
									assetLabel: $scope._langField(asset, 'label')
								}), gettextCatalog.getString('Creation successful'));
							}
						},

						function() {
							$scope.createNewAsset(ev, asset);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};


		$scope.editAsset = function(ev, asset) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$scope.controls = []; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
			AssetService.getAsset(asset.uuid).then(function(assetData) {
				$scope.controls = [{}]; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
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
					.then(function(asset) {
						AssetService.updateAsset(asset,
							function() {
								$scope.updateAssets();

								if (asset.mode == 0 && asset.models && asset.models.length > 0) {
									// If we create a generic asset, but we still have specific models, we should warn
									toastr.warning(gettextCatalog.getString('The asset type has been edited successfully, however without models, the element may not be specific.', {
										assetLabel: $scope._langField(asset, 'label')
									}));
								} else {
									toastr.success(gettextCatalog.getString('The asset type has been edited successfully.', {
										assetLabel: $scope._langField(asset, 'label')
									}), gettextCatalog.getString('Edition successful'));
								}
							},

							function() {
								$scope.editAsset(ev, asset);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteAsset = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete asset type?', {
					label: $scope._langField(item, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				AssetService.deleteAsset(item.uuid,
					function() {
						toastr.success(gettextCatalog.getString('The asset type has been deleted.', {
							label: $scope._langField(item, 'label')
						}), gettextCatalog.getString('Deletion successful'));
						$scope.updateAssets();
						$scope.assets.selected = $scope.assets.selected.filter(assetSelected => assetSelected.uuid != item.uuid);
					}
				);
			});
		};

		$scope.deleteAssetMass = function(ev, item) {
			var count = $scope.assets.selected.length;
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset type(s)?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				var ids = [];
				for (var i = 0; i < $scope.assets.selected.length; ++i) {
					ids.push($scope.assets.selected[i].uuid);
				}

				AssetService.deleteMassAsset(ids, function() {
					toastr.success(gettextCatalog.getString('{{count}} assets type have been deleted.', {
						count: count
					}), gettextCatalog.getString('Deletion successful'));
					$scope.updateAssets();
				});

				$scope.assets.selected = [];

			});
		};

		$scope.assetTypeStr = function(type) {
			switch (type) {
				case 1:
					return gettextCatalog.getString('Primary');
				case 2:
					return gettextCatalog.getString('Secondary');
			}
		};

		/*
		 * THREATS TAB
		 */
		$scope.threats = TableHelperService.build('label' + $scope.userLanguage, 20, 1, '');
		$scope.threats.activeFilter = 1;
		var threatsFilterWatch;

		$scope.selectThreatsTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'threats'
			});
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

		$scope.deselectThreatsTab = function() {
			threatsFilterWatch();
			TableHelperService.unwatchSearch($scope.threats);
			$scope.threats.selected = [];
		};

		$scope.updateThreats = function() {
			var query = angular.copy($scope.threats.query);
			query.status = $scope.threats.activeFilter;

			if ($scope.threats.previousQueryOrder != $scope.threats.query.order) {
				$scope.threats.query.page = query.page = 1;
				$scope.threats.previousQueryOrder = $scope.threats.query.order;
			}

			$scope.threats.promise = ThreatService.getThreats(query);
			$scope.threats.promise.then(
				function(data) {
					$scope.threats.items = data;
				}
			)

		};
		$scope.removeThreatsFilter = function() {
			TableHelperService.removeFilter($scope.threats);
		};


		$scope.toggleThreatStatus = function(threat) {
			ThreatService.patchThreat(threat.uuid, {
				status: !threat.status
			}, function() {
				threat.status = !threat.status;
			});
		};

		$scope.createNewThreat = function(ev, threat) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			$mdDialog.show({
					controller: ['$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', '$q', 'ModelService', 'ThreatService', 'ConfigService', 'threat', CreateThreatDialogCtrl],
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
				.then(function(threat) {
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
						function() {
							$scope.updateThreats();

							if (threat.mode == 0 && threat.models && threat.models.length > 0) {
								// If we create a generic threat, but we still have specific models, we should warn
								toastr.warning(gettextCatalog.getString('The threat has been created successfully, however without models, the element may not be specific.', {
									threatLabel: $scope._langField(threat, 'label')
								}));
							} else {
								toastr.success(gettextCatalog.getString('The threat has been created successfully.', {
									threatLabel: $scope._langField(threat, 'label')
								}), gettextCatalog.getString('Creation successful'));
							}
						},

						function() {
							threat.theme = themeBackup;
							$scope.createNewThreat(ev, threat);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editThreat = function(ev, threat) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$scope.controls = []; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
			ThreatService.getThreat(threat.uuid).then(function(threatData) {
				$scope.controls = [{}]; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
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
					.then(function(threat) {
						var themeBackup = threat.theme;
						if (threat.theme) {
							threat.theme = threat.theme.id;
						}

						ThreatService.updateThreat(threat,
							function() {
								$scope.updateThreats();

								if (threat.mode == 0 && threat.models && threat.models.length > 0) {
									// If we create a generic threat, but we still have specific models, we should warn
									toastr.warning(gettextCatalog.getString('The threat has been edited successfully, however without models, the element may not be specific.', {
										threatLabel: $scope._langField(threat, 'label')
									}));
								} else {
									toastr.success(gettextCatalog.getString('The threat has been edited successfully.', {
										threatLabel: $scope._langField(threat, 'label')
									}), gettextCatalog.getString('Edition successful'));
								}
								threat.theme = themeBackup;
							},

							function() {
								threat.theme = themeBackup;
								$scope.editThreat(ev, threat);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteThreat = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete threat?', {
					label: $scope._langField(item, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				ThreatService.deleteThreat(item.uuid,
					function() {
						toastr.success(gettextCatalog.getString('The threat has been deleted.', {
							label: $scope._langField(item, 'label')
						}), gettextCatalog.getString('Deletion successful'));
						$scope.updateThreats();
						$scope.threats.selected = $scope.threats.selected.filter(threatSelected => threatSelected.uuid != item.uuid);
					}
				);
			});
		};

		$scope.deleteThreatMass = function(ev, item) {
			var outpromise = null;
			var count = $scope.threats.selected.length;

			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected threat(s)?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				var ids = [];
				for (var i = 0; i < $scope.threats.selected.length; ++i) {
					ids.push($scope.threats.selected[i].uuid);
				}

				ThreatService.deleteMassThreat(ids, function() {
					$scope.updateThreats();
					toastr.success(gettextCatalog.getString('{{count}} threats have been deleted.', {
						count: ids.length
					}), gettextCatalog.getString('Deletion successful'));
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


		$scope.selectVulnsTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'vulns'
			});
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

		$scope.deselectVulnsTab = function() {
			TableHelperService.unwatchSearch($scope.vulns);
			$scope.vulns.selected = [];
		};

		$scope.updateVulns = function() {
			var query = angular.copy($scope.vulns.query);
			query.status = $scope.vulns.activeFilter;

			if ($scope.vulns.previousQueryOrder != $scope.vulns.query.order) {
				$scope.vulns.query.page = query.page = 1;
				$scope.vulns.previousQueryOrder = $scope.vulns.query.order;
			}

			$scope.vulns.promise = VulnService.getVulns(query);
			$scope.vulns.promise.then(
				function(data) {
					$scope.vulns.items = data;
				}
			)
		};

		$scope.removeVulnsFilter = function() {
			TableHelperService.removeFilter($scope.vulns);
		};

		$scope.toggleVulnStatus = function(vuln) {
			VulnService.patchVuln(vuln.uuid, {
				status: !vuln.status
			}, function() {
				vuln.status = !vuln.status;
			});
		}

		$scope.createNewVuln = function(ev, vuln) {
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
				.then(function(vuln) {
					var cont = vuln.cont;
					vuln.cont = undefined;

					if (cont) {
						$scope.createNewVuln(ev);
					}

					VulnService.createVuln(vuln,
						function() {
							$scope.updateVulns();

							if (vuln.mode == 0 && vuln.models && vuln.models.length > 0) {
								// If we create a generic vulnerability, but we still have specific models, we should warn
								toastr.warning(gettextCatalog.getString('The vulnerability has been created successfully, however without models, the element may not be specific.', {
									vulnLabel: $scope._langField(vuln, 'label')
								}));
							} else {
								toastr.success(gettextCatalog.getString('The vulnerability has been created successfully.', {
									vulnLabel: $scope._langField(vuln, 'label')
								}), gettextCatalog.getString('Creation successful'));
							}
						},

						function() {
							$scope.createNewVuln(ev, vuln);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editVuln = function(ev, vuln) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$scope.controls = []; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
			VulnService.getVuln(vuln.uuid).then(function(vulnData) {
				$scope.controls = [{}]; //hack pour le bug référencé dans les forums de Material quand on ouvre deux fois d'affilée la modal
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
					.then(function(vuln) {
						VulnService.updateVuln(vuln,
							function() {
								$scope.updateVulns();

								if (vuln.mode == 0 && vuln.models && vuln.models.length > 0) {
									// If we create a generic vulnerability, but we still have specific models, we should warn
									toastr.warning(gettextCatalog.getString('The vulnerability has been edited successfully, however without models, the element may not be specific.', {
										vulnLabel: $scope._langField(vuln, 'label')
									}));
								} else {
									toastr.success(gettextCatalog.getString('The vulnerability has been edited successfully.', {
										vulnLabel: $scope._langField(vuln, 'label')
									}), gettextCatalog.getString('Edition successful'));
								}
							},

							function() {
								$scope.editVuln(ev, vuln);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteVuln = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete vulnerability?', {
					label: $scope._langField(item, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				VulnService.deleteVuln(item.uuid,
					function() {
						toastr.success(gettextCatalog.getString('The vulnerability has been deleted.', {
							label: $scope._langField(item, 'label')
						}), gettextCatalog.getString('Deletion successful'));
						$scope.updateVulns();
						$scope.vulns.selected = $scope.vulns.selected.filter(vulSelected => vulSelected.uuid != item.uuid);
					}
				);
			});
		};

		$scope.deleteVulnMass = function(ev, item) {
			var count = $scope.vulns.selected.length;
			var outpromise = null;

			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected vulnerabilites?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				var ids = [];
				for (var i = 0; i < $scope.vulns.selected.length; ++i) {
					ids.push($scope.vulns.selected[i].uuid);
				}

				VulnService.deleteMassVuln(ids, function() {
					$scope.updateVulns();
					toastr.success(gettextCatalog.getString('{{count}} vulnerabilities have been deleted.', {
						count: ids.length
					}), gettextCatalog.getString('Deletion successful'));
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

		$scope.selectMeasuresTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'measures'
			});
			$scope.updatingReferentials = false;
			ReferentialService.getReferentials({
				order: 'createdAt'
			}).then(function(data) {
				$scope.referentials.items = data;
				$scope.updatingReferentials = true;
			});
		};

		$scope.deselectMeasuresTab = function() {
			TableHelperService.unwatchSearch($scope.measures);
			$scope.measures.selected = [];
		};

		$scope.selectReferential = function(referentialId, index) {
			$scope.refTabSelected = index;
			$scope.referential_uuid = referentialId;
			ReferentialService.getReferential(referentialId).then(function(data) {
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

		$scope.deselectReferentialsTab = function() {
			TableHelperService.removeFilter($scope.measures);
			$scope.measures.selected = [];
		};

		$scope.removeMeasuresFilter = function() {
			TableHelperService.removeFilter($scope.measures);
		};

		$scope.toggleMeasureStatus = function(measure) {
			MeasureService.patchMeasure(measure.uuid, {
				status: !measure.status
			}, function() {
				measure.status = !measure.status;
			});
		}

		$scope.updateReferentials = function() {
			$scope.updatingReferentials = false;
			$scope.referentials.promise = ReferentialService.getReferentials({
				order: 'createdAt'
			});
			$scope.referentials.promise.then(
				function(data) {
					$scope.referentials.items = data;
					$scope.updatingReferentials = true;
				}
			)
		};

		$scope.createNewReferential = function(ev, referential) {
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
						'referential': referential
					}
				})
				.then(function(referential) {
					var cont = referential.cont;
					referential.cont = undefined;

					if (cont) {
						$scope.createNewReferential(ev);
					}

					ReferentialService.createReferential(referential,
						function() {
							$scope.refTabSelected = $scope.referentials.items.count + 1;
							$scope.updateReferentials();
							toastr.success(gettextCatalog.getString('The referential has been created successfully.', {
								referntialLabel: $scope._langField(referential, 'label')
							}), gettextCatalog.getString('Creation successful'));
						},

						function() {
							$scope.createNewReferential(ev, referential);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editReferential = function(ev, referential) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			ReferentialService.getReferential(referential).then(function(referentialData) {
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
					.then(function(referential) {
						ReferentialService.updateReferential(referential,
							function() {
								$scope.updateReferentials();
								toastr.success(gettextCatalog.getString('The referential has been edited successfully.', {
									referentialLabel: referential.label1
								}), gettextCatalog.getString('Edition successful'));
							},

							function() {
								$scope.editReferential(ev, referential);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.matchReferential = function(ev) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			ReferentialService.getReferentials({
				order: 'createdAt'
			}).then(function(data) {
				var matchReferentials = data;
				MeasureService.getMeasures({
					referential: $scope.referential_uuid,
					order: 'code'
				}).then(function(data) {
					var measuresRefSelected = data;
					$mdDialog.show({
						controller: ['$scope', '$mdDialog', '$mdMedia', 'MeasureService', 'MeasureMeasureService', '$q', 'measures', 'referentials', 'referentialSelected', MatchReferentialDialogCtrl],
						templateUrl: 'views/anr/match.referentials.html',
						targetEvent: ev,
						preserveScope: false,
						scope: $scope.$dialogScope.$new(),
						clickOutsideToClose: false,
						fullscreen: useFullScreen,
						locals: {
							'measures': measuresRefSelected,
							'referentials': matchReferentials,
							'referentialSelected': $scope.referential
						}
					})
				});
			});
		};

		$scope.deleteReferential = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete referential?', {
					label: item.label1
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				ReferentialService.deleteReferential(item,
					function() {
						$scope.updateReferentials();
						toastr.success(gettextCatalog.getString('The referential has been deleted.', {
							label: item.label1
						}), gettextCatalog.getString('Deletion successful'));
					}
				);
			});
		};

		$scope.updateMeasures = function() {
			var query = angular.copy($scope.measures.query);
			query.status = $scope.measures.activeFilter;
			query.referential = $scope.referential_uuid;

			if ($scope.measures.previousQueryOrder != $scope.measures.query.order) {
				$scope.measures.query.page = query.page = 1;
				$scope.measures.previousQueryOrder = $scope.measures.query.order;
			}

			MeasureService.getMeasures({
				referential: $scope.referential_uuid,
				order: 'code'
			}).then(function(data) {
				$scope.measuresRefSelected = data;
			});

			$scope.measures.promise = MeasureService.getMeasures(query);
			$scope.measures.promise.then(
				function(data) {
					$scope.measures.items = data;
				}
			)
		};

		$scope.createNewMeasure = function(ev, measure) {
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
						'referential': $scope.referential
					}
				})
				.then(function(measure) {
					var cont = measure.cont;
					measure.cont = undefined;
					measure.referential = $scope.referential.uuid;
					if (cont) {
						$scope.createNewMeasure(ev);
					}

					MeasureService.createMeasure(measure,
						function() {
							$scope.updateMeasures();
							toastr.success(gettextCatalog.getString('The control has been created successfully.', {
								measureLabel: measure.label1
							}), gettextCatalog.getString('Creation successful'));
						},

						function(err) {
							$scope.createNewMeasure(ev, measure);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editMeasure = function(ev, measure) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			MeasureService.getMeasure(measure.uuid).then(function(measureData) {
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
							'referential': $scope.referential
						}
					})
					.then(function(measure) {
						MeasureService.updateMeasure(measure,
							function() {
								$scope.updateMeasures();
								toastr.success(gettextCatalog.getString('The control has been edited successfully.', {
									measureLabel: measure.description1
								}), gettextCatalog.getString('Edition successful'));
							},

							function() {
								$scope.editMeasure(ev, measure);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteMeasure = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete control?', {
					label: item.label1
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				MeasureService.deleteMeasure(item.uuid,
					function() {
						toastr.success(gettextCatalog.getString('The control has been deleted.', {
							label: item.label1
						}), gettextCatalog.getString('Deletion successful'));
						$scope.updateMeasures();
						$scope.measures.selected = $scope.measures.selected.filter(measureSelected => measureSelected.uuid != item.uuid);
					}
				);
			});
		};

		$scope.deleteMeasureMass = function(ev, item) {
			var outpromise = null;
			var count = $scope.measures.selected.length;

			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected controls?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				var ids = [];
				for (var i = 0; i < $scope.measures.selected.length; ++i) {
					ids.push($scope.measures.selected[i].uuid);
				}

				MeasureService.deleteMassMeasure(ids, function() {
					$scope.updateMeasures();
					toastr.success(gettextCatalog.getString('{{count}} controls have been deleted.', {
						count: count
					}), gettextCatalog.getString('Deletion successful'));
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

		$scope.selectAmvsTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'amvs'
			});
			ReferentialService.getReferentials({
				order: 'createdAt'
			}).then(function(data) {
				$scope.referentials_filter.items = data;
				if (data['referentials'][0]) {
					$scope.referentials_filter.selected = data['referentials'][0].uuid;
				}
				$scope.updateAmvs()
			});
			var initAmvsFilter = true;
			initAmvsFilter = $scope.$watchGroup(['amvs.activeFilter', 'amvs.query.filter'], function(newValue, oldValue) {
				if (initAmvsFilter) {
					initAmvsFilter = false;
				} else {
					$scope.updateAmvs();
				}
			});
		};

		$scope.deselectAmvsTab = function() {
			TableHelperService.unwatchSearch($scope.amvs);
			$scope.amvs.selected = [];
		};

		$scope.updateAmvs = function() {
			var query = angular.copy($scope.amvs.query);
			query.status = $scope.amvs.activeFilter;

			if ($scope.amvs.previousQueryOrder != $scope.amvs.query.order) {
				$scope.amvs.query.page = query.page = 1;
				$scope.amvs.previousQueryOrder = $scope.amvs.query.order;
			}

			$scope.amvs.promise = AmvService.getAmvs(query);
			$scope.amvs.promise.then(
				function(data) {
					$scope.amvs.items = data;
				}
			)
		};

		$scope.removeAmvsFilter = function() {
			TableHelperService.removeFilter($scope.amvs);
		};


		$scope.toggleAmvStatus = function(amv) {
			AmvService.patchAmv(amv.uuid, {
				status: !amv.status
			}, function() {
				amv.status = !amv.status;
			})
		}

		$scope.updateMeasuresAMV = function(ev) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			$mdDialog.show({
					controller: ['$scope', '$mdDialog', 'referentials', updateMeasuresAMVDialogCtrl],
					templateUrl: 'views/anr/updateMeasures.amvs.html',
					targetEvent: ev,
					preserveScope: false,
					scope: $scope.$dialogScope.$new(),
					clickOutsideToClose: false,
					fullscreen: useFullScreen,
					locals: {
						'referentials': $scope.referentials_filter.items['referentials'],
					}
				})

				.then(function(params) {
					AmvService.patchAmvs(params,
						function() {
							$scope.updateAmvs();
							toastr.success(gettextCatalog.getString('The risks have been edited successfully.'),
								gettextCatalog.getString('Edition successful'));
							$rootScope.$broadcast('amvUpdated');
						});
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		}

		$scope.createNewAmv = function(ev, amv) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			$mdDialog.show({
					controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'AmvService', '$q', 'amv', 'referentials', CreateAmvDialogCtrl],
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
				.then(function(amv) {
					var amvBackup = angular.copy(amv);

					if (amv.threat) {
						amv.threat = amv.threat.uuid;
					}
					if (amv.asset) {
						amv.asset = amv.asset.uuid;
					}
					if (amv.vulnerability) {
						amv.vulnerability = amv.vulnerability.uuid;
					}

					var cont = amv.cont;
					amv.cont = undefined;

					if (cont) {
						$scope.createNewAmv(ev);
					}

					AmvService.createAmv(amv,
						function() {
							$scope.updateAmvs();
							toastr.success(gettextCatalog.getString('The risk has been created successfully.'), gettextCatalog.getString('Creation successful'));
						},

						function() {
							$scope.createNewAmv(ev, amvBackup);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editAmv = function(ev, amv) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			if (amv == null) {
				return;
			}
			if (amv.uuid != undefined) {
				amv = amv.uuid;
			}

			AmvService.getAmv(amv).then(function(amvData) {
				$mdDialog.show({
						controller: ['$scope', '$mdDialog', 'AssetService', 'ThreatService', 'VulnService', 'MeasureService', 'AmvService', '$q', 'amv', 'referentials', CreateAmvDialogCtrl],
						templateUrl: 'views/anr/create.amvs.html',
						targetEvent: ev,
						preserveScope: false,
						scope: $scope.$dialogScope.$new(),
						clickOutsideToClose: false,
						fullscreen: useFullScreen,
						locals: {
							'amv': amvData,
							'referentials': $scope.referentials_filter.items['referentials']
						}
					})
					.then(function(amv) {
						var amvBackup = angular.copy(amv);
						if (amv.threat) {
							amv.threat = amv.threat.uuid;
						}
						if (amv.asset) {
							amv.asset = amv.asset.uuid;
						}
						if (amv.vulnerability) {
							amv.vulnerability = amv.vulnerability.uuid;
						}


						AmvService.updateAmv(amv,
							function() {
								$scope.updateAmvs();
								toastr.success(gettextCatalog.getString('The risk has been edited successfully.'), gettextCatalog.getString('Edition successful'));
							},

							function() {
								$scope.editAmv(ev, amvBackup);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		if ($stateParams.showid !== undefined) {
			$scope.editAmv(null, $stateParams.showid);
		}


		$scope.deleteAmv = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete this risk?'))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				AmvService.deleteAmv(item.uuid,
					function() {
						toastr.success(gettextCatalog.getString('The risk has been deleted.'), gettextCatalog.getString('Deletion successful'));
						$scope.updateAmvs();
						$scope.amvs.selected = $scope.amvs.selected.filter(amvSelected => amvSelected.uuid != item.uuid);
					}
				);
			});
		};

		$scope.deleteAmvMass = function(ev, item) {
			var count = $scope.amvs.selected.length;
			var outpromise = null;

			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected risk(s)?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				var ids = [];
				for (var i = 0; i < $scope.amvs.selected.length; ++i) {
					ids.push($scope.amvs.selected[i].uuid);
				}

				AmvService.deleteMassAmv(ids, function() {
					toastr.success(gettextCatalog.getString('{{ count }} risks have been deleted.', {
						count: count
					}), gettextCatalog.getString('Deletion successful'));
					$scope.updateAmvs();
				});

				$scope.amvs.selected = [];

			}, function() {});
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
		$scope.objlibs.asset_filter = null;
		$scope.objlibs.lockswitch = false;
		$scope.objlib_assets = [];

		$scope.$watchGroup(['objlibs.category_filter', 'objlibs.asset_filter', 'objlibs.lockswitch'], function(newValue, oldValue) {
			if ($scope.objlibs.category_filter == 0) {
				$scope.objlibs.lockswitch = false;
			}

			if (objLibTabSelected) {
				// Refresh contents
				$scope.updateObjlibs();
			}
		});

		$scope.objlibAssetTypeStr = function(type) {
			if (type == 'bdc') {
				return gettextCatalog.getString('Knowledge base');
			} else if (type == 'anr') {
				return gettextCatalog.getString('Risk analysis');
			} else {
				return type;
			}
		}

		$scope.objlibScopeStr = function(scope) {
			switch (scope) {
				case 1:
					return gettextCatalog.getString('Local');
				case 2:
					return gettextCatalog.getString('Global');
				default:
					return scope;
			}
		}

		$scope.resetObjlibsFilters = function() {
			$scope.objlibs.category_filter = 0;
			$scope.objlibs.asset_filter = null;
			$scope.objlibs.lockswitch = false;
		};

		$scope.selectCategoryFilter = function(id) {
			$scope.objlibs.category_filter = id;
		};

		$scope.selectObjlibsTab = function() {
			$state.transitionTo('main.kb_mgmt.info_risk', {
				'tab': 'objlibs'
			});
			objLibTabSelected = true;
			TableHelperService.watchSearch($scope, 'objlibs.query.filter', $scope.objlibs.query, $scope.updateObjlibs, $scope.objlibs);

			// Load all assets and categories to fill the md-select dropdowns
			AssetService.getAssets({
				order: '-code',
				limit: 0
			}).then(function(data) {
				$scope.objlib_assets = data.assets;
			});
			$scope.updateObjlibsTabCategoriesFilter();
		};

		$scope.deselectObjlibsTab = function() {
			objLibTabSelected = false;
			TableHelperService.unwatchSearch($scope.objlibs);
			$scope.objlibs.selected = [];
		};

		$scope.updateObjlibsTabCategoriesFilter = function() {
			ObjlibService.getObjlibsCats().then(function(data) {
				var buildItemRecurse = function(children, parentPath) {
					var output = [];

					for (var i = 0; i < children.length; ++i) {
						var child = children[i];

						if (parentPath != "") {
							for (let i = 1; i <= 4; i++) {
								child['label' + i] = parentPath['label' + i] + " >> " + child['label' + i];
							}
						}
						output.push(child);

						if (child.child && child.child.length > 0) {
							let parentPathLabels = {};
							for (let i = 1; i <= 4; i++) {
								parentPathLabels['label' + i] = child['label' + i]
							}

							var child_output = buildItemRecurse(child.child, parentPathLabels);
							output = output.concat(child_output);
						}
					}

					return output;
				};

				$scope.objlib_categories = buildItemRecurse(data.categories, "");
			});
		};

		$scope.updateObjlibs = function() {
			var query = angular.copy($scope.objlibs.query);
			if ($scope.objlibs.category_filter > 0 || $scope.objlibs.category_filter == -1) {
				query.category = $scope.objlibs.category_filter;
			}
			if ($scope.objlibs.asset_filter != null) {
				query.asset = $scope.objlibs.asset_filter;
			}
			query.lock = $scope.objlibs.lockswitch;

			if ($scope.objlibs.previousQueryOrder != $scope.objlibs.query.order) {
				$scope.objlibs.query.page = query.page = 1;
				$scope.objlibs.previousQueryOrder = $scope.objlibs.query.order;
			}

			$scope.objlibs.promise = ObjlibService.getObjlibs(query);
			$scope.objlibs.promise.then(
				function(data) {
					$scope.objlibs.items = data;
					$rootScope.objlibs_query = $scope.objlibs.query;
				}
			)
		};

		$scope.removeObjlibsFilter = function() {
			TableHelperService.removeFilter($scope.objlibs);
			$scope.resetObjlibsFilters();
		};

		$scope.createNewObjlib = function(ev, objlib) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			var isUpdate = (objlib && objlib.uuid);

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
				.then(function(objlib) {
					if (objlib) {
						var cont = objlib.cont;
						objlib.cont = undefined;

						var objlibBackup = angular.copy(objlib);

						if (objlib.asset) {
							objlib.asset = objlib.asset.uuid;
						}

						if (objlib.rolfTag) {
							objlib.rolfTag = objlib.rolfTag.id;
						}

						if (isUpdate) {
							if (!objlib.implicitPosition) {
								objlib.implicitPosition = 2; //à la fin
							}
							ObjlibService.updateObjlib(objlib,
								function() {
									$scope.updateObjlibs();
									$scope.updateObjlibsTabCategoriesFilter();
									toastr.success(gettextCatalog.getString('The asset has been edited successfully.', {
										objlibLabel: $scope._langField(objlib, 'label')
									}), gettextCatalog.getString('Edition successful'));
								},

								function() {
									$scope.createNewObjlib(ev, objlibBackup);
								}
							);
						} else {
							if (!objlib.implicitPosition) {
								objlib.implicitPosition = 2; //à la fin
							}
							ObjlibService.createObjlib(objlib,
								function() {
									$scope.updateObjlibs();
									$scope.updateObjlibsTabCategoriesFilter();
									toastr.success(gettextCatalog.getString('The asset has been created successfully.', {
										objlibLabel: $scope._langField(objlib, 'label')
									}), gettextCatalog.getString('Creation successful'));

									if (cont) {
										$scope.createNewObjlib(ev);
									}
								},

								function() {
									$scope.createNewObjlib(ev, objlibBackup);
								}
							);
						}
					}
				}, function() {
					$scope.updateObjlibs();
					$scope.updateObjlibsTabCategoriesFilter();
				});
		};

		$scope.editObjlib = function(ev, objlib, dontFetch) {
			if (objlib && objlib.uuid) {
				if (dontFetch) {
					$scope.createNewObjlib(ev, objlib);
				} else {
					ObjlibService.getObjlib(objlib.uuid).then(function(objlibData) {
						$scope.createNewObjlib(ev, objlibData);
					});
				}
			} else {
				$scope.createNewObjlib(ev, objlib);
			}
		};

		$scope.deleteObjlib = function(ev, item) {
			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete asset?', {
					label: $scope._langField(item, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				ObjlibService.deleteObjlib(item.uuid,
					function() {
						$scope.updateObjlibs();
						toastr.success(gettextCatalog.getString('The asset has been deleted.', {
							label: $scope._langField(item, 'label')
						}), gettextCatalog.getString('Deletion successful'));
					}
				);
			});
		};

		$scope.deleteObjlibMass = function(ev, item) {
			var count = $scope.objlibs.selected.length;
			var outpromise = null;

			var confirm = $mdDialog.confirm()
				.title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected asset(s)?', {
					count: count
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				angular.forEach($scope.objlibs.selected, function(value, key) {
					ObjlibService.deleteObjlib(value.uuid,
						function() {
							if (outpromise) {
								$timeout.cancel(outpromise);
							}

							outpromise = $timeout(function() {
								toastr.success(gettextCatalog.getString('{{count}} assets have been deleted.', {
									count: count
								}), gettextCatalog.getString('Deletion successful'));
								$scope.updateObjlibs();
							}, 350);
						}
					);
				});

				$scope.objlibs.selected = [];

			}, function() {});
		};

		//Import File Center

		$scope.importFile = function(ev, tab) {
			$mdDialog.cancel();
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$mdDialog.show({
					controller: ['$scope', '$mdDialog', 'ConfigService', 'AssetService', 'ThreatService',
						'VulnService', 'MeasureService', 'SOACategoryService', 'TagService', 'RiskService',
						'MeasureMeasureService', 'ObjlibService', 'gettextCatalog', '$q', 'tab',
						'referential', ImportFileDialogCtrl
					],
					templateUrl: 'views/anr/import.file.html',
					targetEvent: ev,
					scope: $scope.$dialogScope.$new(),
					preserveScope: false,
					clickOutsideToClose: false,
					fullscreen: useFullScreen,
					locals: {
						'tab': tab,
						'referential': $scope.RefSelected,
					}
				})
				.then(function(importData) {
					switch (tab) {

						case 'Asset types':
							AssetService.createAsset(importData, function(result) {
								$scope.$parent.updateAssets();
								successCreateObject(result)
							});
							break;
						case 'Threats':
							ThreatService.createThreat(importData, function(result) {
								$scope.$parent.updateThreats();
								successCreateObject(result)
							});
							break;
						case 'Vulnerabilties':
							VulnService.createVuln(importData, function(result) {
								$scope.$parent.updateVulns();
								successCreateObject(result)
							});
							break;
						case 'Controls':
							MeasureService.createMeasure(importData, function(result) {
								$scope.$parent.updateMeasures();
								successCreateObject(result)
							});
							break;

						case 'Information risks':
							AmvService.createAmv(importData, function(result) {
								$scope.updateAmvs();
								successCreateObject(result)
							});
							break;
						case 'Categories':
							SOACategoryService.createCategory(importData, function(result) {
								successCreateObject(result)
							});
							break;
						case 'Tags':
							TagService.createTag(importData, function(result) {
								$scope.$parent.updateTags();
								successCreateObject(result)
							});
							break;
						case 'Operational risks':
							RiskService.createRisk(importData, function(result) {
								$scope.$parent.updateRisks();
								successCreateObject(result)
							});
							break;
						case 'Matches':
							MeasureMeasureService.createMeasureMeasure(importData, function(result) {
								successCreateObject(result)
							});
							break;
						case 'Assets library':
							ObjlibService.createObjlib(importData, function(result) {
								$scope.updateObjlibs();
								successCreateObject(result)
							});
							break;

						default:
					}

					function successCreateObject(result) {
						toastr.success(gettextCatalog.getString((Array.isArray(result.id) ? result.id.length : 1) + ' ' + tab + ' ' + 'have been created successfully.'),
							gettextCatalog.getString('Creation successful'));
					};
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		}
	}


	//////////////////////
	// DIALOGS
	//////////////////////

	function CreateAssetDialogCtrl($scope, $mdDialog, ModelService, ConfigService, asset) {
		ModelService.getModels({
			isGeneric: 0
		}).then(function(data) {
			$scope.models = data.models;
		});

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
		ModelService.getModels({
			isGeneric: 0
		}).then(function(data) {
			$scope.models = data.models;
		});

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

		$scope.queryThemeSearch = function(query) {
			var promise = $q.defer();
			ThreatService.getThemes({
				filter: query
			}).then(function(data) {
				promise.resolve(data.themes);
			}, function() {
				promise.reject();
			});
			return promise.promise;
		};

		$scope.selectedThemeItemChange = function(item) {
			$scope.threat.theme = item;
		}

		$scope.createNewTheme = function(ev, theme) {
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
				.then(function(theme) {
					var cont = theme.cont;
					theme.cont = undefined;
					if (cont) {
						$scope.createNewTheme(ev);
					}

					ThreatService.createTheme(theme,
						function(status) {
							theme.id = status.id;
							$scope.selectedThemeItemChange(theme);
							toastr.success(gettextCatalog.getString('The theme has been created successfully.', {
								themeLabel: $scope._langField(theme, 'label')
							}), gettextCatalog.getString('Creation successful'));
						},
						function(err) {
							$scope.createNewTheme(ev, theme);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editTheme = function(ev, theme) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			ThreatService.getTheme(theme.id).then(function(themeData) {
				$mdDialog.show({
						controller: ['$scope', '$mdDialog', 'ConfigService', 'theme', CreateThemeDialogCtrl],
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
					.then(function(theme) {
						ThreatService.updateTheme(theme,
							function() {
								$scope.themeSearchText = theme['label' + $scope.language];
								$scope.selectedThemeItemChange(theme);
								toastr.success(gettextCatalog.getString('The theme has been edited successfully.', {
									themeLabel: $scope._langField(theme, 'label')
								}), gettextCatalog.getString('Edition successful'));
							},

							function() {
								$scope.editTheme(ev, theme);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteTheme = function(ev, theme) {
			var confirm = $mdDialog.confirm()
				.multiple(true)
				.title(gettextCatalog.getString('Are you sure you want to delete theme?', {
					label: $scope._langField(theme, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.theme('light')
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				ThreatService.deleteTheme(theme.id,
					function() {
						$scope.selectedThemeItemChange();
						toastr.success(gettextCatalog.getString('The theme has been deleted.', {
							label: $scope._langField(theme, 'label')
						}), gettextCatalog.getString('Deletion successful'));
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
		$scope.createAndContinue = function() {
			$scope.threat.cont = true;
			$mdDialog.hide($scope.threat);
		}
	}

	function CreateThemeDialogCtrl($scope, $mdDialog, ConfigService, theme) {
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
		ModelService.getModels({
			isGeneric: 0
		}).then(function(data) {
			$scope.models = data.models;
		});

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
		$scope.createAndContinue = function() {
			$scope.vuln.cont = true;
			$mdDialog.hide($scope.vuln);
		}
	}

	function CreateReferentialDialogCtrl($scope, $mdDialog, ReferentialService, ConfigService, referential) {
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
			for (var i = 1; i <= 4; i++) {
				if ($scope.referential['label' + i] == '' && i != defaultLang) {
					$scope.referential['label' + i] = $scope.referential['label' + defaultLang];
				}
			}
			$mdDialog.hide($scope.referential);
		};
		$scope.createAndContinue = function() {
			for (var i = 1; i <= 4; i++) {
				if ($scope.referential['label' + i] == '' && i != defaultLang) {
					$scope.referential['label' + i] = $scope.referential['label' + defaultLang];
				}
			}
			$scope.referential.cont = true;
			$mdDialog.hide($scope.referential);
		}
	}

	function MatchReferentialDialogCtrl($scope, $mdDialog, $mdMedia, MeasureService, MeasureMeasureService, $q, measures, referentials, referentialSelected) {
		$scope.measuresRefSelected = measures.measures;
		$scope.referentialsList = referentials;
		$scope.referentialSelected = referentialSelected;
		$scope.matchMeasures = [];
		$scope.matchRef_filter = '';

		$scope.referentialsList.referentials.forEach(function(ref) {
			var promise = $q.defer();
			if (ref.uuid !== $scope.referentialSelected.uuid) {
				$scope.matchMeasures[ref.uuid] = [];
				$scope.measuresRefSelected.forEach(function(measure) {
					$scope.matchMeasures[ref.uuid][measure.uuid] = [];
					if (Array.isArray(measure.measuresLinked) && Array.isArray(ref.measures)) {
						measure.measuresLinked.forEach(function(measureLinked) {
							var measureFound = ref.measures.filter(ml => ml.uuid == measureLinked.uuid);
							if (measureFound.length > 0) {
								$scope.matchMeasures[ref.uuid][measure.uuid].push(measureLinked);
							}
						})
					}
					promise.resolve($scope.matchMeasures[ref.uuid][measure.uuid]);
				});
				return promise.promise;
			}
		});

		$scope.queryMeasureSearch = function(query, referential, measureuuid) {
			var promise = $q.defer();
			MeasureService.getMeasures({
				filter: query,
				referential: referential,
				order: 'code'
			}).then(function(e) {
				var filtered = [];
				for (var j = 0; j < e.measures.length; ++j) {
					var found = false;
					for (var i = 0; i < $scope.matchMeasures[referential][measureuuid].length; ++i) {

						if ($scope.matchMeasures[referential][measureuuid][i].uuid == e.measures[j].uuid) {
							found = true;
							break;
						}
					}

					if (!found) {
						filtered.push(e.measures[j]);
					}
				}

				promise.resolve(filtered);
			}, function(e) {
				promise.reject(e);
			});

			return promise.promise;
		};

		$scope.addMeasureLinked = function(fatherId, childId) {
			var measuremeasure = {
				father: fatherId,
				child: childId,
			};
			MeasureMeasureService.createMeasureMeasure(measuremeasure);
		};

		$scope.deleteMeasureLinked = function(fatherId, childId) {
			var measuremeasure = {
				father: fatherId,
				child: childId,
			};
			MeasureMeasureService.deleteMeasureMeasure(measuremeasure);
		};

		$scope.exportMatchRefs = function() {
			var csv = '';
			MeasureMeasureService.getMeasuresMeasures().then(function(data) {
				var measuresLinked = data.MeasureMeasure;
				keys = ['father', 'child'];
				var csv = 'control,match\n';
				var uuids = $scope.measuresRefSelected.map(item => item.uuid);
				var measuresLinkedRefSelected = measuresLinked.filter(measure => uuids.includes(measure.father.uuid));
				measuresLinkedRefSelected.forEach(function(item) {
					ctr = 0;
					keys.forEach(function(key) {
						if (ctr > 0) csv += ',';
						csv += item[key].uuid;
						ctr++;
					});
					csv += '\n';
				});

				data = encodeURI('data:text/csv;charset=UTF-8,﻿' + csv);
				link = document.createElement('a');
				link.setAttribute('href', data);
				link.setAttribute('download', 'matchReferentials.csv');
				document.body.appendChild(link);
				link.click();
			})
		};

		$scope.importMatchRefs = function(ev) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$mdDialog.show({
				controller: ['$scope', '$mdDialog', importMatchRefDialogCtrl],
				templateUrl: 'views/anr/create.match.html',
				targetEvent: ev,
				preserveScope: false,
				scope: $scope.$dialogScope.$new(),
				clickOutsideToClose: false,
				fullscreen: useFullScreen,
				locals: {}
			})
		};

		$scope.cancel = function() {
			$mdDialog.cancel();
		};

		$scope.create = function() {
			$mdDialog.hide($scope.matchMeasures);
		};
	}

	function importMatchRefDialogCtrl($scope, $mdDialog) {
		$scope.cancel = function() {
			$mdDialog.cancel();
		};
	}

	function CreateMeasureDialogCtrl($scope, toastr, $mdMedia, $mdDialog, gettextCatalog, SOACategoryService,
		MeasureService, ReferentialService, ConfigService, $q, measure, referential) {

		$scope.language = ConfigService.getDefaultLanguageIndex();
		$scope.categorySearchText = '';
		$scope.RefSelected = referential.uuid;
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

		$scope.queryCategorySearch = function(query) {
			var promise = $q.defer();
			SOACategoryService.getCategories({
				filter: query,
				referential: referential.uuid
			}).then(function(data) {
				promise.resolve(data['categories']);
			}, function() {
				promise.reject();
			});
			return promise.promise;
		};

		$scope.selectedCategoryItemChange = function(item) {
			$scope.measure.category = item;
		}

		$scope.createNewCategory = function(ev, referential, category) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$mdDialog.show({
					controller: ['$scope', '$mdDialog', 'ConfigService', 'referential', 'category', CreateCategoryDialogCtrl],
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
				.then(function(category) {
					var cont = category.cont;
					category.cont = undefined;
					if (cont) {
						$scope.createNewCategory(ev);
					}

					SOACategoryService.createCategory(category,
						function(status) {
							category.id = status.id;
							$scope.selectedCategoryItemChange(category);
							toastr.success(gettextCatalog.getString('The category has been created successfully.', {
								categoryLabel: $scope._langField(category, 'label')
							}), gettextCatalog.getString('Creation successful'));
						},

						function(err) {
							$scope.createNewCategory(ev, category);
						}
					);
				}, function(reject) {
					$scope.handleRejectionDialog(reject);
				});
		};

		$scope.editCategory = function(ev, referential, category) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			SOACategoryService.getCategory(category.id).then(function(categoryData) {
				$mdDialog.show({
						controller: ['$scope', '$mdDialog', 'ConfigService', 'referential', 'category', CreateCategoryDialogCtrl],
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
					.then(function(category) {
						SOACategoryService.updateCategory(category,
							function() {
								$scope.categorySearchText = category['label' + $scope.language];
								$scope.selectedCategoryItemChange(category);
								toastr.success(gettextCatalog.getString('The category has been edited successfully.', {
									categoryLabel: $scope._langField(category, 'label')
								}), gettextCatalog.getString('Edition successful'));
							},

							function() {
								$scope.editCategory(ev, category);
							}
						);
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			});
		};

		$scope.deleteCategory = function(ev, category) {
			var confirm = $mdDialog.confirm()
				.multiple(true)
				.title(gettextCatalog.getString('Are you sure you want to delete category?', {
					label: $scope._langField(category, 'label')
				}))
				.textContent(gettextCatalog.getString('This operation is irreversible.'))
				.targetEvent(ev)
				.theme('light')
				.ok(gettextCatalog.getString('Delete'))
				.cancel(gettextCatalog.getString('Cancel'));
			$mdDialog.show(confirm).then(function() {
				SOACategoryService.deleteCategory(category.id,
					function() {
						$scope.selectedCategoryItemChange();
						toastr.success(gettextCatalog.getString('The category has been deleted.', {
							label: $scope._langField(category, 'label')
						}), gettextCatalog.getString('Deletion successful'));
					}
				);
			});
		};

		$scope.cancel = function() {
			$mdDialog.cancel();
		};

		$scope.create = function() {
			$mdDialog.hide($scope.measure);
		};
		$scope.createAndContinue = function() {
			$scope.measure.cont = true;
			$mdDialog.hide($scope.measure);
		}
	}

	function CreateCategoryDialogCtrl($scope, $mdDialog, ConfigService, referential, category) {
		$scope.language = ConfigService.getDefaultLanguageIndex();
		$scope.RefSelected = referential;

		if (category != undefined && category != null) {
			$scope.category = category;
			delete $scope.category.measures;
			$scope.category.referential = referential;
		} else {
			$scope.category = {
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

	function updateMeasuresAMVDialogCtrl($scope, $mdDialog, referentials) {
		$scope.referentials = referentials;
		$scope.fromReferential = [];
		$scope.toReferential = [];

		$scope.update = function() {
			var params = {
				fromReferential: $scope.fromReferential,
				toReferential: $scope.toReferential
			};
			$mdDialog.hide(params);
		}

		$scope.cancel = function() {
			$mdDialog.cancel();
		};


	}

	function CreateAmvDialogCtrl($scope, $mdDialog, AssetService, ThreatService, VulnService, MeasureService, AmvService, $q, amv, referentials) {
		$scope.amvReferentials = referentials;

		$scope.queryAmvs = function(asset_id) {
			AmvService.getAmvs({
				limit: 0,
				asset: asset_id,
				order: 'position',
				amvid: $scope.amv.uuid
			}).then(function(data) {
				$scope.asset_amvs = data.amvs;
			});
		};

		if (amv != undefined && amv != null) {
			$scope.amv = amv;

			if (amv.asset && amv.asset.uuid) {
				$scope.queryAmvs(amv.asset.uuid);
			}
			if (amv.previous && amv.previous.uuid) {
				$scope.amv.previous = $scope.amv.previous.uuid;
			}
			if (amv.measures.length == undefined) {
				$scope.amv.measures = [];
				referentials.forEach(function(ref) {
					$scope.amv.measures[ref.uuid] = [];
				})
			} else {
				var measuresBackup = $scope.amv.measures;
				$scope.amv.measures = [];
				referentials.forEach(function(ref) {
					$scope.amv.measures[ref.uuid] = measuresBackup.filter(function(measure) {
						return (measure.referential.uuid == ref.uuid);
					})
				})
			}
		} else {
			$scope.amv = {
				asset: null,
				threat: null,
				vulnerability: null,
				referential: null,
				measures: [],
				implicitPosition: 2,
				status: 1
			};
			referentials.forEach(function(ref) {
				$scope.amv.measures[ref.uuid] = [];
			})
		}

		// Asset
		$scope.queryAssetSearch = function(query) {
			var promise = $q.defer();
			AssetService.getAssets({
				filter: query,
				type: 2,
				status: 1
			}).then(function(e) {
				promise.resolve(e.assets);
			}, function(e) {
				promise.reject(e);
			});

			return promise.promise;
		};

		$scope.selectedAssetItemChange = function(item) {
			if (item) {
				$scope.amv.asset = item;
				$scope.queryAmvs(item.uuid);
			}
		}

		// Threat
		$scope.queryThreatSearch = function(query) {
			var promise = $q.defer();
			ThreatService.getThreats({
				filter: query,
				status: 1
			}).then(function(e) {
				promise.resolve(e.threats);
			}, function(e) {
				promise.reject(e);
			});

			return promise.promise;
		};

		$scope.selectedThreatItemChange = function(item) {
			if (item) {
				$scope.amv.threat = item;
			}
		}

		// Vulnerability
		$scope.queryVulnSearch = function(query) {
			var promise = $q.defer();
			VulnService.getVulns({
				filter: query,
				status: 1
			}).then(function(e) {
				promise.resolve(e.vulnerabilities);
			}, function(e) {
				promise.reject(e);
			});

			return promise.promise;
		};

		$scope.selectedVulnItemChange = function(item) {
			if (item) {
				$scope.amv.vulnerability = item;
			}
		}

		// Referentials

		$scope.selectAmvReferential = function(referential) {
			$scope.amv.referential = referential;
		}

		// Measures
		$scope.queryMeasureSearch = function(query) {
			var promise = $q.defer();
			MeasureService.getMeasures({
				filter: query,
				referential: $scope.amv.referential.uuid,
				order: 'code'
			}).then(function(e) {
				var filtered = [];
				for (var j = 0; j < e.measures.length; ++j) {
					var found = false;
					for (var i = 0; i < $scope.amv.measures[$scope.amv.referential.uuid].length; ++i) {

						if ($scope.amv.measures[$scope.amv.referential.uuid][i].uuid == e.measures[j].uuid) {
							found = true;
							break;
						}
					}

					if (!found) {
						filtered.push(e.measures[j]);
					}
				}

				promise.resolve(filtered);
			}, function(e) {
				promise.reject(e);
			});

			return promise.promise;
		};

		$scope.cancel = function() {
			$mdDialog.cancel();
		};

		$scope.create = function() {

			referentials.forEach(function(ref) {
				var promise = $q.defer();
				if ($scope.amv.measures[ref.uuid] != undefined) {
					$scope.amv.measures[ref.uuid].forEach(function(measure) {
						promise.resolve($scope.amv.measures.push(measure.uuid));
					})
				}
				return promise.promise;

			})

			if ($scope.amv.implicitPosition == 3 && !$scope.amv.previous) {
				$scope.amv.implicitPosition = 1;
			}
			delete $scope.amv.referential;
			$mdDialog.hide($scope.amv);
		};
		$scope.createAndContinue = function() {

			referentials.forEach(function(ref) {
				var promise = $q.defer();
				if ($scope.amv.measures[ref.uuid] != undefined) {
					$scope.amv.measures[ref.uuid].forEach(function(measure) {
						promise.resolve($scope.amv.measures.push(measure.uuid));
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

	function ImportFileDialogCtrl($scope, $mdDialog, ConfigService, AssetService, ThreatService,
		VulnService, MeasureService, SOACategoryService, TagService, RiskService,
		MeasureMeasureService, ObjlibService, gettextCatalog, $q, tab, referential) {

		$scope.tab = tab;
		$scope.guideVisible = false;
		$scope.language = ConfigService.getDefaultLanguageIndex();
		$scope.defaultLang = angular.copy($scope.language);
		var requiredFields = [];
		var extItemToCreate = [];
		var codes = [];
		var matches = [];
		var allMeasures = [];
		var allTags = [];
		var allLibraryCategories = [];
		var externalItem = null;
		var pluralExtItem = null;
		var extItemField = null;
		var parentIdsPaths = [];
		var externalItemsFound = [];

		switch (tab) {
			case 'Asset types':
				AssetService.getAssets().then(function(data) {
					codes = data.assets.map(asset => asset.code.toLowerCase());
				});
				break;
			case 'Threats':
				externalItem = 'theme';
				pluralExtItem = 'themes';
				ThreatService.getThreats().then(function(data) {
					codes = data.threats.map(threat => threat.code.toLowerCase());
				});
				ThreatService.getThemes().then(function(data) {
					$scope.actualExternalItems = data.themes;
				});
				break;
			case 'Vulnerabilties':
				VulnService.getVulns().then(function(data) {
					codes = data.vulnerabilities.map(vulnerability => vulnerability.code.toLowerCase());
				});
				break;
			case 'Controls':
				externalItem = 'category';
				pluralExtItem = 'categories';
				MeasureService.getMeasures({
					referential: referential
				}).then(function(data) {
					codes = data.measures.map(measure => measure.code.toLowerCase());
				});
				SOACategoryService.getCategories({
					order: $scope._langField('label'),
					referential: referential
				}).then(function(data) {
					$scope.actualExternalItems = data.categories;
				});
				break;
			case 'Information risks':
				externalItem = 'theme';
				pluralExtItem = 'themes';
				ThreatService.getThemes().then(function(data) {
					$scope.actualExternalItems = data.themes;
				});
				break;
			case 'Tags':
				TagService.getTags().then(function(data) {
					codes = data.tags.map(tag => tag.code.toLowerCase());
				});
				break;
			case 'Operational risks':
				externalItem = 'tag';
				pluralExtItem = 'tags';
				RiskService.getRisks().then(function(data) {
					codes = data.risks.map(risk => risk.code.toLowerCase());
				});
				TagService.getTags().then(function(data) {
					$scope.actualExternalItems = data.tags;
				});
				break;
			case 'Matches':
				MeasureMeasureService.getMeasuresMeasures().then(function(data) {
					matches = data.MeasureMeasure.map(mm => mm.father.uuid.toLowerCase() + mm.child.uuid.toLowerCase());
				});
				MeasureService.getMeasures().then(function(data) {
					allMeasures = data.measures;
				});
				break;
			case 'Assets library':
				externalItem = 'category';
				pluralExtItem = 'categories';
				AssetService.getAssets().then(function(data) {
					codes = data.assets;
				});
				TagService.getTags().then(function(data) {
					allTags = data.tags;
				})
				ObjlibService.getObjlibsCats().then(function(data) {
					allLibraryCategories = getFlatLibCategories(data.categories);
					allTreeViewCategories = data.categories;
					$scope.actualExternalItems = getLibraryCategoriesPath(data.categories);
				});
				break;
			default:
		}

		$scope.items = {
			'Asset types': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Network')
				},
				'description': {
					'field': 'description1\ndescription2\ndescription3\ndescription4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('Any network hardware (router, switch, firewall, etc.)')
				},
				'type': {
					'field': 'type',
					'required': true,
					'type': '1,2',
					'example': '\n1: ' + gettextCatalog.getString('primary asset') + '\n2: ' + gettextCatalog.getString('secondary asset')
				},
				'mode': {
					'field': 'mode',
					'required': true,
					'type': '0,1',
					'example': '\n0: ' + gettextCatalog.getString('generic') + '\n1: ' + gettextCatalog.getString('specific')
				}
			},
			'Threats': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Fire')
				},
				'description': {
					'field': 'description1\ndescription2\ndescription3\ndescription4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('Any situation that could facilitate the conflagration of premises or equipment.')
				},
				'c': {
					'field': 'c',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'i': {
					'field': 'i',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'a': {
					'field': 'a',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'mode': {
					'field': 'mode',
					'required': true,
					'type': '0,1',
					'example': '\n0: ' + gettextCatalog.getString('generic') + '\n1: ' + gettextCatalog.getString('specific')
				},
				'theme': {
					'field': 'theme label' + $scope.defaultLang,
					'fieldBis': 'theme label1\ntheme label2\ntheme label3\ntheme label4',
					'required': true,
					'type': 'text',
					'example': $scope.actualExternalItems
				}
			},
			'Vulnerabilties': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('No IT charter specifying the rules of use')
				},
				'description': {
					'field': 'description1\ndescription2\ndescription3\ndescription4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('IT charter Conditions of use General terms and conditions')
				},
				'mode': {
					'field': 'mode',
					'required': true,
					'type': '0,1',
					'example': '\n0: ' + gettextCatalog.getString('generic') + '\n1: ' + gettextCatalog.getString('specific')
				}
			},
			'Controls': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Access control policy')
				},
				'category': {
					'field': 'category label' + $scope.defaultLang,
					'fieldBis': 'category label1\ncategory label2\ncategory label3\ncategory label4',
					'required': true,
					'type': 'text',
					'example': $scope.actualExternalItems
				}
			},
			'Information risks': {
				'asset_code': {
					'field': 'asset code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'asset_label': {
					'field': 'asset label' + $scope.defaultLang,
					'fieldBis': 'asset label1\nasset label2\nasset label3\nasset label4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Network')
				},
				'asset_description': {
					'field': 'asset description1\nasset description2\nasset description3\nasset description4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('Any network hardware (router, switch, firewall, etc.)')
				},
				'threat_code': {
					'field': 'threat code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'threat_label': {
					'field': 'threat label' + $scope.defaultLang,
					'fieldBis': 'threat label1\nthreat label2\nthreat label3\nthreat label4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Fire')
				},
				'threat_description': {
					'field': 'threat description1\nthreat description2\nthreat description3\nthreat description4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('Any situation that could facilitate the conflagration of premises or equipment.')
				},
				'threat_c': {
					'field': 'threat c',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'threat_i': {
					'field': 'threat i',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'threat_a': {
					'field': 'threat a',
					'required': false,
					'type': 'Boolean',
					'example': '0,1,false,true'
				},
				'theme': {
					'field': 'threat theme label' + $scope.defaultLang,
					'fieldBis': 'threat theme label1\nthreat theme label2\nthreat theme label3\nthreat theme label4',
					'required': true,
					'type': 'text',
					'example': $scope.actualExternalItems
				},
				'vulnerability_code': {
					'field': 'vulnerability code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'vulnerability_label': {
					'field': 'vulnerability label' + $scope.defaultLang,
					'fieldBis': 'vulnerability label1\nvulnerability label2\nvulnerability label3\nvulnerability label4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('No IT charter specifying the rules of use')
				},
				'vulnerability_description': {
					'field': 'vulnerability description1\nvulnerability description2\nvulnerability description3\nvulnerability description4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('IT charter Conditions of use General terms and conditions')
				}
			},
			'Tags': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('Governance')
				}
			},
			'Operational risks': {
				'code': {
					'field': 'code',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('The applicable legal and regulatory requirements are not determined, understood and consistently met')
				},
				'description': {
					'field': 'description1\ndescription2\ndescription3\ndescription4',
					'required': false,
					'type': 'text',
					'example': gettextCatalog.getString('Product Compliance Customer agreement')
				},
				'tag': {
					'field': 'tag label' + $scope.defaultLang,
					'fieldBis': 'tag label1\ntag label2\ntag label3\ntag label4',
					'required': false,
					'type': 'text',
					'example': $scope.actualExternalItems
				}
			},
			'Matches': {
				'control': {
					'field': 'control',
					'required': true,
					'type': 'uuid',
					'example': ''
				},
				'match': {
					'field': 'match',
					'required': true,
					'type': 'uuid',
					'example': ''
				}
			},
			'Assets library': {
				'name': {
					'field': 'name' + $scope.defaultLang,
					'fieldBis': 'name1\nname2\nname3\nname4',
					'required': true,
					'type': 'text',
					'example': 'C16, 123, CAZ, C-12'
				},
				'label': {
					'field': 'label' + $scope.defaultLang,
					'fieldBis': 'label1\nlabel2\nlabel3\nlabel4',
					'required': true,
					'type': 'text',
					'example': gettextCatalog.getString('No IT charter specifying the rules of use')
				},
				'asset_type': {
					'field': 'asset type code',
					'required': true,
					'type': 'text',
					'example': 'Asset type code must exist in the Knowledge Base'
				},
				'scope': {
					'field': 'scope',
					'required': true,
					'type': '1,2',
					'example': '\n1: ' + gettextCatalog.getString('local') + '\n2: ' + gettextCatalog.getString('global')
				},
				'mode': {
					'field': 'mode',
					'required': true,
					'type': '0,1',
					'example': '\n0: ' + gettextCatalog.getString('generic') + '\n1: ' + gettextCatalog.getString('specific')
				},
				'rolfTag': {
					'field': 'operational risk tag',
					'required': false,
					'type': 'text',
					'example': 'Only one operational risk tag can be linked and must exist in the Knowledge Base'
				},
				'category': {
					'field': 'category label' + $scope.defaultLang,
					'fieldBis': 'category label1\ncategory label2\ncategory label3\ncategory label4',
					'required': true,
					'type': 'text',
					'example': $scope.actualExternalItems
				},
			},
		};

		$scope.parseFile = function(fileContent) {
			$scope.check = false;
			$scope.isProcessing = true;
			if (typeof fileContent === 'object') {
				if (Array.isArray(fileContent)) {
					$scope.importData = checkFile({
						data: fileContent
					});
				} else {
					alertWrongSchema();
				}
			} else {
				Papa.parse(fileContent, {
					header: true,
					skipEmptyLines: true,
					trimHeaders: true,
					beforeFirstChunk: function(chunk) {
						let rows = chunk.split(/\r\n|\r|\n/);
						rows[0] = rows[0].toLowerCase().trim();
						return rows.join('\n');
					},
					complete: function(importData) {
						$scope.importData = checkFile(importData);
					}
				});
			}
		};

		function checkFile(file) {
			extItemToCreate = [];
			if (externalItem) {
				extItemField = $scope.items[tab][externalItem].field;
			}

			for (let index in $scope.items[tab]) {
				if ($scope.items[tab][index]['required']) {
					requiredFields.push($scope.items[tab][index]['field']);
				}
			}

			if (!file.meta || file.meta.fields.some(rf => requiredFields.includes(rf)) && file.data.length > 0) {
				if (tab == 'Information risks') {
					const amvItems = ['asset', 'threat', 'vulnerability'];
					getAllAmvItems().then(function(values) {
						file.data.reduce((acc, current, index, data) => {
							findExternalItem(current, $scope.actualExternalItems, extItemField.slice(0, -1));
							const duplicate = acc.find(item => item['asset code'] === current['asset code'] &&
								item['threat code'] === current['threat code'] &&
								item['vulnerability code'] === current['vulnerability code']
							);
							if (!duplicate) {
								current.error = '';
								current['asset uuid'] = current['threat uuid'] = current['vulnerability uuid'] = null;
								checkRequiredFields(current);

								amvItems.forEach((amvItem, i) => {
									let itemFound = values[i].find(item => item.code.toLowerCase() === current[amvItem + ' code'].toLowerCase().trim());
									if (itemFound !== undefined) {
										current[amvItem + ' uuid'] = itemFound.uuid;
									}
								});

								return acc.concat([current]);
							} else {
								current.error = gettextCatalog.getString('This risk is already on the import list');
								$scope.check = true;
								return acc;
							}
						}, []);
						alertCreateNewExternalItems();
					});
				} else if (tab == 'Assets library') {
					var libraryCategoryPaths = [];

					file.data.forEach((row, index) => {
						let isPrimaryAsset = false;
						row.error = '';
						checkRequiredFields(row);

						if (row['asset type code'] && !codes.map(code => code.code.toLowerCase()).includes(row['asset type code'].toLowerCase().trim())) {
							row.error += gettextCatalog.getString('the asset type code does not exist. Create it before import') + "\n";;
							$scope.check = true;
						} else if (row['asset type code']) {
							let assetType = codes.find(code => code.code.toLowerCase() === row['asset type code'].toLowerCase().trim())
							row.asset = assetType.uuid;
							row.isPrimaryAsset = assetType.type == 1 ? true : false;
						}

						if (row['operational risk tag'] && row.isPrimaryAsset) {
							if (!allTags.map(tag => tag.code.toLowerCase()).includes(row['operational risk tag'].toLowerCase().trim())) {
								row.error += gettextCatalog.getString('the operational risk tag does not exist. Create it before import') + "\n";;
								$scope.check = true;
							} else if (row['operational risk tag']) {
								row.rolfTag = allTags.find(tag => tag.code.toLowerCase() === row['operational risk tag'].toLowerCase().trim()).id
							}
						}

						if (row[extItemField]) {
							let path = row[extItemField]
								.split(" ")
								.join("")
								.toLowerCase()
								.trim();

							let libraryCategories = [];
							parentIdsPaths = [];

							for (let i = 1; i <= 4; i++) {
								let [categoryFound, parentIds] = findExternalObjectsCategory(row[extItemField.slice(0, -1) + i].split(">>"), allTreeViewCategories);
								libraryCategories[i] = categoryFound
								row.parentIdsPath = parentIds;
							}
							row.categoriesToCreate = libraryCategories.every(lc => !lc);

							if (libraryCategories.every(lc => !lc) && !libraryCategoryPaths.includes(path)) {
								libraryCategoryPaths.push(path);
								extItemToCreate.push(row[extItemField]);
								row.alert = $scope.check ? false : true;
							}
						}
					});
				} else if (tab == 'Matches') {
					file.data.forEach(row => {
						row.error = '';
						checkRequiredFields(row);

						if (row.control && row.match) {
							let uuids = allMeasures.map(item => item.uuid);
							let measure = [];

							if (!uuids.includes(row.control.toLowerCase().trim())) {
								row.control = '-';
								row.error += gettextCatalog.getString('control does not exist') + "\n";
								$scope.check = true;
							}
							if (!uuids.includes(row.match.toLowerCase().trim())) {
								row.match = '-';
								row.error += gettextCatalog.getString('match does not exist') + "\n";
								$scope.check = true;
							}
							if (matches.includes(row.control.toLowerCase().trim() + row.match.toLowerCase().trim())) {
								measure = allMeasures.filter(measure => measure.uuid == row.control.toLowerCase().trim())
								row.father = row.control;
								row.control = measure[0].referential['label' + $scope.language] + " : " + measure[0].code + " - " + measure[0]['label' + $scope.language];

								measure = allMeasures.filter(measure => measure.uuid == row.match.toLowerCase().trim())
								row.child = row.match;
								row.match = measure[0].referential['label' + $scope.language] + " : " + measure[0].code + " - " + measure[0]['label' + $scope.language];
								row.error += gettextCatalog.getString('this matching is already in use') + "\n";
								$scope.check = true;
							} else {
								measure = allMeasures.filter(measure => measure.uuid == row.control.toLowerCase().trim())
								if (measure.length) {
									row.father = row.control;
									row.control = measure[0].referential['label' + $scope.language] + " : " + measure[0].code + " - " + measure[0]['label' + $scope.language];
								}

								measure = allMeasures.filter(measure => measure.uuid == row.match.toLowerCase().trim())
								if (measure.length) {
									row.child = row.match;
									row.match = measure[0].referential['label' + $scope.language] + " : " + measure[0].code + " - " + measure[0]['label' + $scope.language];
								}
							}
						}
					});
				} else {
					let codeList = angular.copy(codes);
					file.data.forEach(row => {
						row.error = '';
						checkRequiredFields(row)

						if (requiredFields.includes('code') && row.code) {
							if (codeList.includes(row.code.toLowerCase().trim())) {
								row.error += gettextCatalog.getString('code is already in use') + "\n";;
								$scope.check = true;
							} else {
								codeList.push(row.code.toLowerCase().trim());
							}
						}

						if (externalItem && row[extItemField]) {
							if (externalItem == 'tag') {
								let tags = [];
								for (let i = 1; i <= 4; i++) {
									tags[i] = row[extItemField.slice(0, -1) + i].toString().split("/");
								}

								tags[1].map((x, i) => {
									tagToSearch = {};
									tags.map((tag, index) => {
										tagToSearch[extItemField.slice(0, -1) + index] = tag[i]
									})
									let tagFound = findExternalItem(tagToSearch, $scope.actualExternalItems, extItemField.slice(0, -1));
									if (!tagFound) row.alert = true;
								})
							} else {
								findExternalItem(row, $scope.actualExternalItems, extItemField.slice(0, -1));
							}
						}
					});
				}
				alertCreateNewExternalItems();
			} else {
				alertWrongSchema();
				return;
			}
			$scope.isProcessing = false;
			return file.data;
		};

		$scope.uploadFile = async function() {
			let filedata = angular.copy($scope.importData);
			var itemFields = ['label1', 'label2', 'label3', 'label4', 'description1', 'description2', 'description3', 'description4'];

			switch (tab) {
				case 'Threats':
					itemFields.push('theme');
					break;
				case 'Controls':
					itemFields.push('uuid', 'category', 'referential');
					break;
				case 'Information risks':
					let amvItems = ['asset', 'threat', 'vulnerability'];
					amvItems.forEach(function(amvItem) {
						itemFields.push(amvItem + ' uuid',
							amvItem + ' label1', amvItem + ' label2', amvItem + ' label3', amvItem + ' label4',
							amvItem + ' description1', amvItem + ' description2', amvItem + ' description3', amvItem + ' description4',
						);
					});
					itemFields.push('threat theme label1', 'threat theme label2', 'threat theme label3', 'threat theme label4');
					break;
				case 'Operational risks':
					itemFields.push('tags');
					break;
				case 'Matches':
					itemFields.push('father', 'child');
					break;
				default:
			}
			for (var index in $scope.items[tab]) {
				itemFields.push($scope.items[tab][index]['field']);
			}

			for await (var [i, row] of filedata.entries()) {
				if (tab == 'Threats') {
					let cia = ['c', 'i', 'a'];
					cia.forEach(criteria => {
						if (!row[criteria] || row[criteria] == 0 || row[criteria].toLowerCase().trim() == 'false') {
							row[criteria] = false;
						} else {
							row[criteria] = true;
						}
					});

					if (row[extItemField]) {
						if (inExternalItemsFound(row[extItemField])) {
							row.theme = inExternalItemsFound(row[extItemField]);
						} else {
							let themeToCreate = {
								label1: row['theme label1'] ? row['theme label1'].trim() : null,
								label2: row['theme label2'] ? row['theme label2'].trim() : null,
								label3: row['theme label3'] ? row['theme label3'].trim() : null,
								label4: row['theme label4'] ? row['theme label4'].trim() : null,
							}

							await createTheme(themeToCreate).then(function(id) {
								row.theme = id;
							});
						}
					}
				}

				if (tab == 'Controls') {
					row.referential = referential;
					if (row[extItemField]) {
						if (inExternalItemsFound(row[extItemField])) {
							row.category = inExternalItemsFound(row[extItemField]);
						} else {
							let categoryToCreate = {
								referential: referential,
								label1: row['category label1'] ? row['category label1'].trim() : null,
								label2: row['category label2'] ? row['category label2'].trim() : null,
								label3: row['category label3'] ? row['category label3'].trim() : null,
								label4: row['category label4'] ? row['category label4'].trim() : null,
							}

							await createCategory(categoryToCreate).then(function(id) {
								row.category = id;
							});
						}
					}
				}

				if (tab == 'Information risks') {
					let theme = null;
					if (row[extItemField]) {
						if (inExternalItemsFound(row[extItemField])) {
							theme = inExternalItemsFound(row[extItemField]);
						} else {
							let themeToCreate = {
								label1: row['threat theme label1'] ? row['threat theme label1'].trim() : null,
								label2: row['threat theme label2'] ? row['threat theme label2'].trim() : null,
								label3: row['threat theme label3'] ? row['threat theme label3'].trim() : null,
								label4: row['threat theme label4'] ? row['threat theme label4'].trim() : null,
							}
							await createTheme(themeToCreate).then(function(id) {
								theme = id;
							});
						}
					}
					filedata[i] = {
						asset: {
							uuid: row['asset uuid'],
							code: row['asset code'].trim(),
							label1: row['asset label1'],
							label2: row['asset label2'],
							label3: row['asset label3'],
							label4: row['asset label4'],
							type: 2,
							description1: row['asset description1'],
							description2: row['asset description2'],
							description3: row['asset description3'],
							description4: row['asset description4']
						},
						threat: {
							uuid: row['threat uuid'],
							code: row['threat code'].trim(),
							label1: row['threat label1'],
							label2: row['threat label2'],
							label3: row['threat label3'],
							label4: row['threat label4'],
							description1: row['threat description1'],
							description2: row['threat description2'],
							description3: row['threat description3'],
							description4: row['threat description4'],
							c: (!row['threat c'] || row['threat c'] == 0 || row['threat c'].toLowerCase().trim() == 'false' ? false : true),
							i: (!row['threat i'] || row['threat i'] == 0 || row['threat i'].toLowerCase().trim() == 'false' ? false : true),
							a: (!row['threat a'] || row['threat a'] == 0 || row['threat a'].toLowerCase().trim() == 'false' ? false : true),
							theme: theme
						},
						vulnerability: {
							uuid: row['vulnerability uuid'],
							code: row['vulnerability code'].trim(),
							label1: row['vulnerability label1'],
							label2: row['vulnerability label2'],
							label3: row['vulnerability label3'],
							label4: row['vulnerability label4'],
							description1: row['vulnerability description1'],
							description1: row['vulnerability description2'],
							description1: row['vulnerability description3'],
							description1: row['vulnerability description4']
						}
					}
				}

				if (tab == 'Assets library') {
					libraryCategoryPaths = [];
					let libraryCategories = row[extItemField].toString().split(">>");

					for await (let [index, libraryCategory] of libraryCategories.entries()) {
						if (row.categoriesToCreate && row.parentIdsPath.length - index == 0) {
							let libraryCategoryFound = allLibraryCategories.find(category => {
								let parent = index == 0 ? null : row.parentIdsPath[index - 1];
								return category['label' + $scope.defaultLang].toLowerCase().trim() == libraryCategory.toLowerCase().trim() &&
									category.parent == parent;
							});

							if (!libraryCategoryFound) {
								let categoryToCreate = {
									parent: index == 0 ? null : row.parentIdsPath[index - 1],
									implicitPosition: 2,
									position: null,
									label1: row['category label1'].toString().split(">>")[index] ? row['category label1'].toString().split(">>")[index].trim() : null,
									label2: row['category label2'].toString().split(">>")[index] ? row['category label2'].toString().split(">>")[index].trim() : null,
									label3: row['category label3'].toString().split(">>")[index] ? row['category label3'].toString().split(">>")[index].trim() : null,
									label4: row['category label4'].toString().split(">>")[index] ? row['category label4'].toString().split(">>")[index].trim() : null,
								};
								await createLibraryCategory(categoryToCreate).then(function(id) {
									row.parentIdsPath.push(id);
								});
							} else {
								row.parentIdsPath.push(libraryCategoryFound.id);
							}
						}
					}

					filedata[i] = {
						asset: row.asset,
						category: row.parentIdsPath[row.parentIdsPath.length - 1],
						implicitPosition: 2,
						label1: row.label1 ? row.label1.trim() : null,
						label2: row.label2 ? row.label2.trim() : null,
						label3: row.label3 ? row.label3.trim() : null,
						label4: row.label4 ? row.label4.trim() : null,
						mode: row.mode,
						name1: row.name1 ? row.name1.trim() : null,
						name2: row.name2 ? row.name2.trim() : null,
						name3: row.name3 ? row.name3.trim() : null,
						name4: row.name4 ? row.name4.trim() : null,
						rolfTag: row.rolfTag,
						scope: row.isPrimaryAsset ? 1 : row.scope,
					}
				}

				if (tab == 'Operational risks') {
					let tagsIds = [];
					let tags = row[extItemField].toString().split("/");
					for await (let [index, tag] of tags.entries()) {
						if (inExternalItemsFound(tag)) {
							tagsIds.push(inExternalItemsFound(tag));
						} else {
							let tagToCreate = {
								code: row[extItemField].toString().split("/")[index] + Math.floor(Math.random() * 1000),
								label1: row['tag label1'].toString().split("/")[index] ? row['tag label1'].toString().split("/")[index].trim() : null,
								label2: row['tag label2'].toString().split("/")[index] ? row['tag label2'].toString().split("/")[index].trim() : null,
								label3: row['tag label3'].toString().split("/")[index] ? row['tag label3'].toString().split("/")[index].trim() : null,
								label4: row['tag label4'].toString().split("/")[index] ? row['tag label4'].toString().split("/")[index].trim() : null,
							}
							await createTag(tagToCreate).then(function(id) {
								tagsIds.push(id);
							});
						}
						row.tags = tagsIds;
					}
				}

				for (let pdk of Object.keys(row)) {
					if (!itemFields.includes(pdk.toLowerCase())) {
						delete row[pdk];
					}
				}
			}
			$mdDialog.hide(filedata);
		};

		$scope.toggleGuide = function() {
			$scope.guideVisible = !$scope.guideVisible;
		};

		$scope.downloadExempleFile = function() {
			var fields = [];
			for (let index in $scope.items[tab]) {
				if ($scope.items[tab][index]['field']) {
					if ($scope.items[tab][index]['field'].match(/\n/)) {
						var temp = $scope.items[tab][index]['field'].replace(/\n/g, ',');
						fields.push(temp);
					} else if ($scope.items[tab][index]['fieldBis']) {
						var temp = $scope.items[tab][index]['fieldBis'].replace(/\n/g, ',');
						fields.push(temp);
					} else {
						fields.push($scope.items[tab][index]['field']);
					}
				}
			}
			data = encodeURI('data:text/csv;charset=UTF-8,﻿' + fields.join());
			link = document.createElement('a');
			link.setAttribute('href', data);
			link.setAttribute('download', 'ExampleFile.csv');
			document.body.appendChild(link);
			link.click();
		}

		$scope.cancel = function() {
			$mdDialog.cancel();
		};

		function getFlatLibCategories(categories) {
			return categories.reduce((acc, category) => {
				if (category.child && category.child.length) {
					acc.push(category)
					acc = acc.concat(getFlatLibCategories(category.child));
				} else {
					acc.push(category);
				}
				return acc;
			}, []);
		}

		function getLibraryCategoriesPath(categories, parentPath) {
			return categories.reduce((acc, category) => {
				if (parentPath) {
					for (let i = 1; i <= 4; i++) {
						category['label' + i] = parentPath['label' + i] + " >> " + category['label' + i];
					}
				}
				acc.push(category);

				if (category.child && category.child.length) {
					let parentPathLabels = {};
					for (let i = 1; i <= 4; i++) {
						parentPathLabels['label' + i] = category['label' + i]
					}
					acc = acc.concat(getLibraryCategoriesPath(category.child, parentPathLabels));
				}
				return acc;
			}, []);
		};

		function findExternalItem(externalItem, actualExternalItems, field) {
			let externalItemFound = false;
			actualExternalItems.some(actualExternalItem => {
				for (var i = 1; i <= 4; i++) {
					for (var j = 1; j <= 4; j++) {
						if (actualExternalItem['label' + i] &&
							externalItem[field + j] &&
							actualExternalItem['label' + i].toLowerCase().trim() === externalItem[field + j].toLowerCase().trim()) {
							externalItemFound = actualExternalItem;
							return true;
						}
					}
				}
			})
			if (externalItemFound) {
				addExternalItemFound(externalItem[extItemField], externalItemFound.id);
			}

			if (!externalItemFound && !extItemToCreate.includes(externalItem[extItemField].toLowerCase().trim())) {
				extItemToCreate.push(externalItem[extItemField].toLowerCase().trim());
				externalItem.alert = true;
			}
			return externalItemFound;
		};

		function findExternalObjectsCategory(externalCategory, actualTreeViewsCategories) {
			let categoryFound = actualTreeViewsCategories.find(category => {
				for (let i = 1; i <= 4; i++) {
					if (category['label' + i] && category['label' + i].toLowerCase().trim() == externalCategory[0].toLowerCase().trim()) {
						return category['label' + i].toLowerCase().trim() == externalCategory[0].toLowerCase().trim();
					}
				}
			});

			if (!categoryFound) return [false, parentIdsPaths];

			if (externalCategory.length == 1) {
				if (!parentIdsPaths.includes(categoryFound.id)) parentIdsPaths.push(categoryFound.id);
				return [true, parentIdsPaths];
			}

			if (externalCategory.length > 1 && categoryFound.child) {
				if (!parentIdsPaths.includes(categoryFound.id)) parentIdsPaths.push(categoryFound.id);
				externalCategory.shift();
				return findExternalObjectsCategory(externalCategory, categoryFound.child)
			} else {
				if (!parentIdsPaths.includes(categoryFound.id)) parentIdsPaths.push(categoryFound.id);
				return [false, parentIdsPaths]
			}

		};

		function inExternalItemsFound(label) {
			if (externalItemsFound[label.toString().toLowerCase().trim()]) {
				return externalItemsFound[label.toString().toLowerCase().trim()];
			}
			return false;
		}

		function addExternalItemFound(label, id) {
			externalItemsFound[label.toString().toLowerCase().trim()] = id;
		}

		function alertCreateNewExternalItems() {
			if (!$scope.check && extItemToCreate.length) {
				var confirm = $mdDialog.confirm()
					.multiple(true)
					.title(gettextCatalog.getPlural(extItemToCreate.length, 'New {{externalItem}}', 'New {{pluralExtItem}}', {
						externalItem: gettextCatalog.getString(externalItem),
						pluralExtItem: gettextCatalog.getString(pluralExtItem)
					}))
					.textContent(gettextCatalog.getPlural(
							extItemToCreate.length,
							'Do you want to create new {{externalItem}} ?',
							'Do you want to create {{count}} new {{pluralExtItem}} ?', {
								count: extItemToCreate.length,
								externalItem: gettextCatalog.getString(externalItem),
								pluralExtItem: gettextCatalog.getString(pluralExtItem)
							}) + '\n\r\n\r' +
						extItemToCreate.toString().replace(/,/g, '\n\r'))
					.theme('light')
					.ok(gettextCatalog.getString('Create & Import'))
					.cancel(gettextCatalog.getString('Cancel'));
				$mdDialog.show(confirm)
					.then(function() {
						$scope.uploadFile();
					}, function(reject) {
						$scope.handleRejectionDialog(reject);
					});
			}
		}

		function alertWrongSchema() {
			let alert = $mdDialog.alert()
				.multiple(true)
				.title(gettextCatalog.getString('File error'))
				.textContent(gettextCatalog.getString('Wrong schema'))
				.theme('light')
				.ok(gettextCatalog.getString('Cancel'))
			$mdDialog.show(alert);
			$scope.check = true;
		}

		function checkRequiredFields(row) {
			requiredFields.forEach(requiredField => {
				if (!row[requiredField]) {
					row.error += requiredField + " " + gettextCatalog.getString('is mandatory') + "\n";;
					$scope.check = true;
				}
			});
		}

		async function getAllAmvItems() {
			let [assets, threats, vulnerabilities] = await Promise.all([
				AssetService.getAssets().then(function(data) {
					return data.assets.map(asset => ({
						code: asset.code,
						uuid: asset.uuid
					}));
				}),
				ThreatService.getThreats().then(function(data) {
					return data.threats.map(threat => ({
						code: threat.code,
						uuid: threat.uuid
					}));
				}),
				VulnService.getVulns().then(function(data) {
					return data.vulnerabilities.map(vulnerability => ({
						code: vulnerability.code,
						uuid: vulnerability.uuid
					}));
				})
			]);
			return [assets, threats, vulnerabilities];
		}

		async function createTheme(theme) {
			var promise = $q.defer();
			ThreatService.createTheme(theme, await
				function(result) {
					addExternalItemFound(theme['label' + $scope.defaultLang], result.id);
					promise.resolve(result.id);
				});
			return promise.promise
		}

		async function createCategory(category) {
			var promise = $q.defer();
			SOACategoryService.createCategory(category, await
				function(result) {
					addExternalItemFound(category['label' + $scope.defaultLang], result.id);
					promise.resolve(result.id);
				});
			return promise.promise
		}

		async function createLibraryCategory(libraryCategory) {
			var promise = $q.defer();
			ObjlibService.createObjlibCat(libraryCategory, await
				function(result) {
					libraryCategory.id = result.categ.id;
					allLibraryCategories.push(libraryCategory);
					promise.resolve(result.categ.id);
				});
			return promise.promise
		}

		async function createTag(tag) {
			var promise = $q.defer();
			TagService.createTag(tag, await
				function(result) {
					addExternalItemFound(tag['label' + $scope.defaultLang], result.id);
					promise.resolve(result.id);
				});
			return promise.promise
		}
	}
})();
