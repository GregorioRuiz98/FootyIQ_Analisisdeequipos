from pydantic import BaseModel


class DashboardPayload(BaseModel):
    matchesToday: int
    activeAlerts: int
    analysisInProgress: int
    opportunities: int
    modelPrecision: float
    recentMatches: list[dict]
    upcomingMatches: list[dict]
