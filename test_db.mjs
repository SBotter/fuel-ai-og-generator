import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('./.env.local'))

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
    const { data: activities, error: err1 } = await supabase.from('activities').select('*').limit(1).order('created_at', { ascending: false })
    if (!activities || activities.length === 0) return console.error('No activities found')

    const activity = activities[0]
    console.log("Activity ID:", activity.id)
    console.log("Activity Name:", activity.name)
    console.log("Activity Distance:", activity.distance)
    console.log("Activity Elevation:", activity.total_elevation_gain)

    const { data: profile, error: err2 } = await supabase.from('profiles').select('*').eq('id', activity.user_id).single()
    console.log("Profile Weight:", profile?.weight)

    const distanceKm = Number((activity.distance / 1000).toFixed(2))
    const climbingPerKm = distanceKm > 0 ? activity.total_elevation_gain / distanceKm : 0
    let muscularLoad = "low"
    if (climbingPerKm > 25) muscularLoad = "high"
    else if (climbingPerKm > 10) muscularLoad = "moderate"
    else muscularLoad = "low"

    const sportType = activity.sport_type || activity.type || "Run"
    if (sportType.toLowerCase().includes("mountain") || sportType.toLowerCase().includes("trail")) {
        if (muscularLoad === "low") muscularLoad = "moderate"
        else if (muscularLoad === "moderate") muscularLoad = "high"
    }

    console.log("Sport Type:", sportType)
    console.log("Climbing Per Km:", climbingPerKm)
    console.log("Muscular Load:", muscularLoad)

    const userWeight = profile?.weight ? Number(profile.weight) : 70
    console.log("User Weight:", userWeight)

    let proteinToRepairEngine = 0
    if (muscularLoad === "high") proteinToRepairEngine = Math.round(userWeight * 0.4)
    else if (muscularLoad === "moderate") proteinToRepairEngine = Math.round(userWeight * 0.25)
    else proteinToRepairEngine = Math.round(userWeight * 0.1)

    console.log("Calculated Engine Protein:", proteinToRepairEngine)

    // Generator logic
    const distanceKmGen = (activity.distance / 1000).toFixed(1)
    const distanceVal = parseFloat(distanceKmGen)
    const elevation = Math.round(activity.total_elevation_gain)
    const climbingPerKmGen = distanceVal > 0 ? elevation / distanceVal : 0;

    let muscularLoadGen = "low";
    if (climbingPerKmGen > 25) muscularLoadGen = "high";
    else if (climbingPerKmGen > 10) muscularLoadGen = "moderate";
    else muscularLoadGen = "low";

    if (sportType.toLowerCase().includes("mountain") || sportType.toLowerCase().includes("trail")) {
        if (muscularLoadGen === "low") muscularLoadGen = "moderate";
        else if (muscularLoadGen === "moderate") muscularLoadGen = "high";
    }

    let proteinToRepairGen = 0
    if (muscularLoadGen === "high") proteinToRepairGen = Math.round(userWeight * 0.4)
    else if (muscularLoadGen === "moderate") proteinToRepairGen = Math.round(userWeight * 0.25)
    else proteinToRepairGen = Math.round(userWeight * 0.1)

    console.log("Calculated Gen Protein:", proteinToRepairGen)
}

test()
