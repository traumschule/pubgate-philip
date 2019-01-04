## PubGate Blog
Extension for [PubGate](https://github.com/autogestion/pubgate), minimalist blogging UI

Forked from [philip-trauner.me](https://github.com/PhilipTrauner/philip-trauner.me)


Requires PubGate >= 0.2.6
### Run

 - Install PubGate
 - Install philip
 ```
 pip install git+https://github.com/autogestion/pubgate-philip.git

```
 - Update conf.cfg with
```
EXTENSIONS = [..., "philip"]
```
 - run 
```
python run_api.py

```