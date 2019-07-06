## PubGate Blog
Minimalist blogging ActivityPub client made with Svelte

Could be deployed as extension for [PubGate](https://github.com/autogestion/pubgate), or connected to remote instance

### Run as Pubgate Extension

Requires PubGate >= 0.2.15

 - Install PubGate
 - Install philip ```pip install git+https://github.com/autogestion/pubgate-philip.git```
 - Update conf.cfg with
```
EXTENSIONS = [..., "philip"]
TITLE = 'Lightweight ActivityPub Blogging Server'
DESCRIPTION = 'minimalist blogging UI based on Code of philip-trauner.me website.'
LOGO = 'https://raw.githubusercontent.com/github/explore/df833523cdfb6fa65bb162c67405302a494d6c52/topics/activitypub/activitypub.png'
CONTACT = 'https://mastodon.social/users/autogestion'
```
 - run ```python run_api.py```



### Run standalone client

  - ```git clone git@github.com:autogestion/pubgate-philip.git```
  - Update philip/public/index.html 
  ```
    var base_url = "https://<instance_domain>";
    var pubgate_instance = <true if running against remote pubgate instance>
  ```
  - run ```cd philip && npm run dev```