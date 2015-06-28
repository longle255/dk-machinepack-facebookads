module.exports = {


  friendlyName: 'get ad sets in campaign',


  description: 'get all ad sets in a campaign, and fetch standard metadata',


  extendedDescription: 'get all ad sets for a given campaign group, and return id, daily budget, status',
  cacheable: true,

  inputs: {
    adCampaignGroupId: {
      example: '31231321312',
      description: 'facebook adCampaignGroup is the endpoint for a campaign ',
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
      description: 'Here are the ad sets for the inputted campaign',
    },

  },


  fn: function (inputs,exits) {

    var doJSONRequest = require('../lib/do-request');
    var fields = inputs.fields || 'adcampaigns{id,account_id,campaign_group_id,campaign_status,daily_budget,stats,lifetime_budget,name},adgroups{name}';
    // GET ad accounts/ and send the api token as a header
    doJSONRequest({
      method: 'get',
      url: ['/v2.3/', inputs.adCampaignGroupId ].join(""),
      data: {
        'access_token': inputs.accessToken,
        'fields' : fields
      },
      headers: {},
    },
    function (err, responseBody) {
      if (err) { return exits.error(err); }

      var myJson = responseBody.adcampaigns;
      var newArray = [];
      var len = myJson.data.length;
      console.log(myJson.data.length);
      for (var i=0; i<len; i++){
        newArray.push({
          'id' : myJson.data[i].id,
          'daily_budget' : myJson.data[i].daily_budget,
          'lifetime_budget' : myJson.data[i].lifetime_budget,
          'stats' : myJson.data[i].stats,
          'name': myJson.data[i].name,
          'campaign_status': myJson.data[i].campaign_status
         });
       }
       responseBody = newArray;
      return exits.success(responseBody);
    });
  }
};
