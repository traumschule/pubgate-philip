## PubGate Blog
Extension for [PubGate](https://github.com/autogestion/pubgate), minimalist blogging js client made with Svelte

Forked from [philip-trauner.me](https://github.com/PhilipTrauner/philip-trauner.me)


Requires PubGate >= 0.2.13
### Run

 - Install PubGate
 - Install philip
 ```
 pip install git+https://github.com/autogestion/pubgate-philip.git

```
 - Update conf.cfg with
```
EXTENSIONS = [..., "philip"]
TITLE = 'Lightweight ActivityPub Blogging Server'
DESCRIPTION = 'minimalist blogging UI based on Code of philip-trauner.me website.'
LOGO = 'https://raw.githubusercontent.com/github/explore/df833523cdfb6fa65bb162c67405302a494d6c52/topics/activitypub/activitypub.png'
CONTACT = 'https://mastodon.social/users/autogestion'
```
 - run 
```
python run_api.py

```