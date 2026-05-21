import aiohttp
from .songs.songs import Songs
from .albums.albums import Albums
from .artists.artists import Artists
from .trending.trending import Trending
from .newreleases.newreleases import NewReleases
from .charts.charts import Charts
from .playlists.playlists import Playlists
from . import endpoints
from .functions import Functions
from .errors import Errors


class GaanaPy(Songs, Albums, Artists, Trending, NewReleases, Charts, Playlists):
    def __init__(self):
        self._session = None
        self.api_endpoints = endpoints
        self.functions = Functions()
        self.errors = Errors()
        self.info = False

    @property
    def aiohttp(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
