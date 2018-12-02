from time import time
from _thread import start_new_thread
from typing import List, Optional

from spotipy import Spotify as Spotipy


class Playlist:
    def __init__(self, name: str, url: str, image: Optional[str] = None) -> None:
        self.name = name
        self.url = url
        self.image = image

    def __repr__(self) -> str:
        return self.name


class Spotify:
    def __init__(
        self,
        user: str,
        spotify: Spotipy,
        refresh_delay: int = 3600,
        disable_fetch: bool = False,
    ) -> None:
        self.user = user
        self.sp = spotify

        self.refresh_delay = refresh_delay
        self.disable_fetch = False

        self._playlists: List[Playlist] = []
        self.last_retrieve: float = -1.0

    @property
    def playlists(self) -> List[Playlist]:
        if not self.disable_fetch:
            if self.last_retrieve != None:
                if (self.last_retrieve + self.refresh_delay) < time():
                    self.last_retrieve = time()
                    start_new_thread(self._fetch_playlists, ())
            else:
                self._fetch_playlists()
                self.last_retrieve = time()
        return self._playlists

    def _fetch_playlists(self) -> None:
        playlists = self.sp.user_playlists(self.user)
        playlists_ = []

        while playlists:
            for playlist in playlists["items"]:
                playlists_.append(
                    Playlist(
                        playlist["name"],
                        playlist["external_urls"]["spotify"],
                        playlist["images"][0]["url"]
                        if len(playlist["images"]) > 0
                        else None,
                    )
                )
            if playlists["next"]:
                playlists = self.sp.next(playlists)
            else:
                playlists = None

        self._playlists = playlists_
