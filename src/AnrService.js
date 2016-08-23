(function () {

    angular
        .module('BackofficeApp')
        .factory('AnrService', [ '$resource', AnrService ]);

    function AnrService($resource) {
        var self = this;

        self.AnrResource = $resource('/api/anr/:anrId', { anrId: '@anrId' },
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        self.LibraryResource = $resource('/api/anr/:anrId/library/:objectId', { anrId: '@anrId', objectId: '@objectId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        self.InstanceResource = $resource('/api/anr/:anrId/instances/:instId', { anrId: '@anrId', instId: '@instId' },
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        self.ScalesResource = $resource('/api/anr/:anrId/scales/:scaleId', { anrId: '@anrId', scaleId: '@scaleId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        self.ScalesCommentResource = $resource('/api/anr/:anrId/scales/:scaleId/comments/:commentId', { anrId: '@anrId', scaleId: '@scaleId', commentId: "@commentId" },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });


        // ANRs
        var patchAnr = function (anr_id, fields, success, error) {;
            self.AnrResource.patch({anrId: anr_id}, fields, success, error);
        };

        // Object library
        var addExistingObjectToLibrary = function (anr_id, object_id, success, error) {
            new self.LibraryResource({anrId: anr_id, objectId: object_id}).$save(success, error);
        };

        var addNewObjectToLibrary = function (anr_id, object, success, error) {
            var obj_pump = angular.copy(object);
            obj_pump.anrId = anr_id;
            new self.LibraryResource(obj_pump).$save(success, error);
        };

        var getObjectsLibrary = function (anr_id) {
            return self.LibraryResource.query({anrId: anr_id}).$promise;
        };

        // Instances
        var getInstances = function (anr_id) {
            return self.InstanceResource.query({anrId: anr_id}).$promise;
        };

        var getInstance = function (anr_id, instance_id) {
            return self.InstanceResource.query({anrId: anr_id, instId: instance_id}).$promise;
        };

        var deleteInstance = function (anr_id, instance_id, success, error) {
            self.InstanceResource.delete({instId: instance_id, anrId: anr_id}, success, error);
        };

        var addInstance = function (anr_id, object_id, parent_id, position, success, error) {
            new self.InstanceResource({object: object_id, parent: parent_id, position: position, anrId: anr_id}).$save(success, error);
        };

        var updateInstance = function (instance, success, error) {
            new self.InstanceResource(instance).$save(success, error);
        };

        var moveInstance = function (anr_id, instance_id, parent_id, position, success, error) {
            self.InstanceResource.patch({instId: instance_id, anrId: anr_id, parent: parent_id, position: position}, success, error);
        };

        // Scales
        var getScales = function (anr_id) {
            return self.ScalesResource.query({anrId: anr_id}).$promise;
        };

        var updateScale = function (anr_id, type, min, max, success, error) {
            return self.ScalesResource.update({anrId: anr_id, scaleId: type}, {min: min, max: max}, success, error);
        };

        // Scales comments
        var getScaleComments = function (anr_id, type) {
            return self.ScalesCommentResource.query({anrId: anr_id, scaleId: type}).$promise;
        };

        var createScaleComment = function (anr_id, scale_id, row, comment, type_impact_id, success, error) {
            new self.ScalesCommentResource({anrId: anr_id, scaleId: scale_id, val: row, scaleTypeImpactId: type_impact_id, comment1: comment}).$save(success, error);
        };

        var updateScaleComment = function (anr_id, scale_id, comment_id, params, success, error) {
            return self.ScalesCommentResource.update({anrId: anr_id, scaleId: scale_id, commentId: comment_id}, params, success, error);
        };



        return {
            patchAnr: patchAnr,

            addExistingObjectToLibrary: addExistingObjectToLibrary,
            addNewObjectToLibrary: addNewObjectToLibrary,
            getObjectsLibrary: getObjectsLibrary,

            getScales: getScales,
            updateScale: updateScale,
            getScaleComments: getScaleComments,
            createScaleComment: createScaleComment,
            updateScaleComment: updateScaleComment,

            getInstances: getInstances,
            getInstance: getInstance,
            deleteInstance: deleteInstance,
            addInstance: addInstance,
            updateInstance: updateInstance,
            moveInstance: moveInstance
        };
    }

})
();