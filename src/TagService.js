(function () {

    angular
        .module('BackofficeApp')
        .factory('TagService', [ '$resource', TagService ]);

    function TagService($resource) {
        var self = this;

        self.TagResource = $resource('/api/rolf-tags/:tagId', { tagId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getTags = function (params) {
            return self.TagResource.query(params).$promise;
        };

        var getTag = function (id) {
            return self.TagResource.query({tagId: id}).$promise;
        };

        var createTag = function (params, success, error) {
            new self.TagResource(params).$save(success, error);
        };

        var updateTag = function (params, success, error) {
            self.TagResource.update(params, success, error);
        };

        var deleteTag = function (id, success, error) {
            self.TagResource.delete({tagId: id}, success, error);
        };

        return {
            getTags: getTags,
            getTag: getTag,
            createTag: createTag,
            deleteTag: deleteTag,
            updateTag: updateTag
        };
    }

})
();