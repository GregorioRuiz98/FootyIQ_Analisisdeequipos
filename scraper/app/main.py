import os
from datetime import datetime

from fastapi import FastAPI

from .fotmob_client import FotmobClient
from .league_catalog import MAIN_LEAGUES
from .scheduler import ScraperScheduler
from .browser_client import cdp_healthcheck

app = FastAPI(title="FootyIQ Scraper", version="0.1.0")
client = FotmobClient(base_url=os.getenv("SCRAPER_BASE_URL", "https://www.fotmob.com"))
scheduler = ScraperScheduler()
cache: dict = {}


async def refresh_cache() -> None:
    global cache
    cache = await client.fetch_dashboard_payload()


@app.on_event("startup")
async def on_startup() -> None:
    await refresh_cache()
    scheduler.start(refresh_cache)


@app.on_event("shutdown")
def on_shutdown() -> None:
    scheduler.stop()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "footyiq-scraper"}


@app.get("/browser/health")
async def browser_health() -> dict:
    return await cdp_healthcheck()


@app.get("/fotmob/dashboard")
async def dashboard() -> dict:
    if not cache:
        await refresh_cache()
    return cache


@app.get("/fotmob/catalog/leagues")
def leagues_catalog() -> dict:
    return {
        "verifiedFrom": "https://www.fotmob.com/all-leagues",
        "leagues": MAIN_LEAGUES,
    }


@app.get("/fotmob/league/{league_id}")
async def league_data(league_id: int) -> dict:
    data = await client.fetch_league(league_id)
    return {
        "entity": "league",
        "leagueId": league_id,
        "data": data,
    }


@app.get("/fotmob/team/{team_id}")
async def team_data(team_id: int) -> dict:
    data = await client.fetch_team(team_id)
    return {
        "entity": "team",
        "teamId": team_id,
        "data": data,
    }


@app.get("/fotmob/team/{team_id}/players")
async def team_players(team_id: int) -> dict:
    data = await client.extract_team_players(team_id)
    return {
        "entity": "players",
        "teamId": team_id,
        "data": data,
    }


@app.get("/fotmob/player/{player_id}")
async def player_data(player_id: int, teamId: int | None = None) -> dict:
    data = await client.fetch_player(player_id, teamId)
    return {
        "entity": "player",
        "playerId": player_id,
        "teamId": teamId,
        "data": data,
    }


@app.get("/fotmob/match/{match_id}")
async def match_data(match_id: int, leagueId: int | None = None) -> dict:
    data = await client.fetch_match(match_id, leagueId)
    return {
        "entity": "match",
        "matchId": match_id,
        "leagueId": leagueId,
        "data": data,
    }


@app.get("/fotmob/league/{league_id}/matches")
async def league_matches(league_id: int) -> dict:
    data = await client.extract_league_matches(league_id)
    return {
        "entity": "matches",
        "leagueId": league_id,
        "data": data,
    }


@app.get("/fotmob/matches")
async def matches_by_date(date: str | None = None) -> dict:
    resolved_date = date or datetime.now().strftime("%Y%m%d")
    data = await client.fetch_matches_by_date(resolved_date)
    return {
        "entity": "matches",
        "date": resolved_date,
        "data": data,
    }
