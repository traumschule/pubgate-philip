import os

from sanic import response, Blueprint
from jinja2 import Environment, PackageLoader

from pubgate.utils.networking import fetch

philip_v1 = Blueprint('philip')

philip_dir = os.path.dirname(os.path.abspath(__file__))
philip_v1.static('/static', f'{philip_dir}/public')

jinja_env = Environment(
    loader=PackageLoader("philip", "public"), trim_blocks=True, lstrip_blocks=True
)


@philip_v1.route('/local', methods=['GET'])
@philip_v1.route('/fed', methods=['GET'])
@philip_v1.route('/home', methods=['GET'])
@philip_v1.route('/about', methods=['GET'])
@philip_v1.route('/', methods=['GET'])
async def home(request, **kwargs):
    return response.html(
        jinja_env.get_template("svelte_home.jinja").render(
            static_url="static/",
            conf=request.app.config,
        )
    )


@philip_v1.route('/proxy_fetch', methods=['POST'])
async def home(request, **kwargs):
    post = await fetch(request.json["url"])
    return response.json(
        post, headers={'Access-Control-Allow-Origin': '*'}
    )
