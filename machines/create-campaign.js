module.exports = {


  friendlyName: 'create-campaign',


  description: 'create a facebook campaign',


  extendedDescription: 'create facebook campaign and return campaignGroupId',
  cacheable: true,

  inputs: {
    fbUserId: {
      example: '509503',
      description: 'facebook user id',
      required: true
    },

    fbPageId: {
      example: '3213213124',
      description: 'facebook page id',
      required: true
    },


    accessToken: {
      example: 'CAACEdEose0cBACBhZA7DJbYapwM7oZBt1EWhPiGqibBZAZAZCZCe6IOkfDRzrs1jyZCS93zSuj9GaNQQtxbny0jeSCqyBNaQUl3ocDiD3lO4GSboFm5B7NogSHFzTGYw0rdpndDKolQcfsS5nYeYwZAIKXF1WPzgGaGxNIDh36oZBHuazcN3WSNmL9jGyO9YmYlZBmZCcigBuMFvtXj4XlzNWyb',
      description: 'this is the facebook issued access token for a given user and app pair',
      required: true
    },
  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'The Facebook API returned an error (i.e. a non-2xx status code)',
    },

    success: {
      example: {},
      description: 'here is your campaign id',
    },

  },


  fn: function (inputs,exits) {
    // fetch ad set information
    var doJSONRequest = require('../lib/do-request');
    // get page name
    doJSONRequest({
      method: 'get',
      url: ['/v2.3/', inputs.fbUserId, '/adaccounts'].join(""),
      data: {
        'access_token': inputs.accessToken,
      },
      headers: {},
    }, function (err, act) {
      if (err) { return exits.error(err); }

      doJSONRequest({
        method: 'get',
        url: ['/v2.3/', inputs.fbPageId ].join(""),
        data: {
          'fields' : 'name',
          'access_token' : inputs.accessToken
        },
        headers: {},
      },

      function (err, page) {
        if (err) { return exits.error(err); }


        // GET ad accounts/ and send the api token as a header
        doJSONRequest({
          method: 'post',
          url: ['/v2.3/', act.data[0].id, '/adcampaign_groups' ].join(""),
          data: {
            'name' : ['Woo - ', page.name].join(""),
            'objective' : 'WEBSITE_CONVERSIONS',
            'campaign_group_status' : 'PAUSED',
            'access_token': inputs.accessToken

          },
          headers: {},
        },

        function (err, responseBody) {
          if (err) { return exits.error(err); }
          return exits.success(responseBody);
        });
      });
    });
  }
}
