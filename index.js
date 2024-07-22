require('dotenv').config()
const { GistBox } = require('gist-box')
const { v2, auth } = require('osu-api-extended')

const SCOPE_LIST = ['public'];
const main = async () => {
    const { GIST_ID, OSU_USERNAME, OSU_MODE, GH_TOKEN, CLIENT_ID, CLIENT_SECRET } = process.env
    //GIST_ID, OSU_USERNAME, OSU_MODE -> public
    //GH_TOKEN, CLIENT_ID, CLIENT_SECRET -> env var
    //OSU_MODE ex. "osu" | "fruits" | "mania" | "taiko"

    // Get the user's osu data
    console.log(`Getting data for ${OSU_USERNAME}`)

    // Auth via client
    await auth.login(CLIENT_ID, CLIENT_SECRET, SCOPE_LIST);
    const data = await v2.user.details(OSU_USERNAME, OSU_MODE)

    // Sort data
    const lines = [
        `${"Level".padStart(9)} 🎮 | Lv${data.statistics.level.current || 0} ${generateBarChart(data.statistics.level.progress, 21)} ${data.statistics.level.progress}%\n`,
        `${"Rank".padStart(9)} 📈 | ${("#" + numberWithCommas(data.statistics.global_rank))} / ${getFlagEmoji(data.country.code)} #${numberWithCommas(data.statistics.country_rank).padEnd(7)} (${numberWithCommas(data.statistics.pp)}pp)\n`,
        `${"Accuracy".padStart(9)} 🎯 | ${Math.round(parseFloat(data.statistics.hit_accuracy) * 100) / 100}%\n`,
        `${"Playtime".padStart(9)} 🕓 | ${numberWithCommas(Math.floor(parseFloat(data.statistics.play_time) / 60 / 60))} hr\n`,
        `${"Playcount".padStart(9)} 💾 | ${numberWithCommas(data.statistics.play_count)}\n`,
    ];

    const box = new GistBox({ id: GIST_ID, token: GH_TOKEN })
    try {
        await box.update({
            filename: `🎶 ${data.username}'s osu!${(OSU_MODE=="osu")?"":OSU_MODE} stats`,
            content: lines.join('')
        })
        console.log('Gist updated!')
    } catch (err) {
        console.log('Error getting or update the Gist:')
        return console.log(err)
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getFlagEmoji(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

/**
 * clone and refactor from https://github.com/matchai/waka-box
 */
function generateBarChart(percent, size) {
    const syms = "░▏▎▍▌▋▊▉█"
  
    const frac = Math.floor((size * 8 * percent) / 100)
    const barsFull = Math.floor(frac / 8)
    if (barsFull >= size) {
      return syms.substring(8, 9).repeat(size)
    }
    const semi = frac % 8
  
    return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
      .join("")
      .padEnd(size, syms.substring(0, 1))
  }

main()
