require('dotenv').config()
const { GistBox } = require('gist-box')
const { v2, auth } = require('osu-api-extended')
const { Toolkit } = require('actions-toolkit')

const SCOPE_LIST = ['public'];

Toolkit.run(
    async tools => {
        const { GIST_ID, OSU_USERNAME, OSU_MODE, GH_TOKEN, CLIENT_ID, CLEINT_SECRET } = process.env
        //GIST_ID, OSU_USERNAME, OSU_MODE -> public
        //GH_TOKEN, CLIENT_ID, CLEINT_SECRET -> env var
        //OSU_MODE ex. "osu" | "fruits" | "mania" | "taiko"

        // Get the user's osu data
        tools.log.debug(`Getting data for ${OSU_USERNAME}`)

        // Auth via client
        await auth.login(CLIENT_ID, CLEINT_SECRET, SCOPE_LIST);
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
            tools.log.debug(`Updating Gist ${GIST_ID}`)
            await box.update({
                filename: `🎶 ${data.username}'s osu!${(mode=="osu")?"":mode} stats`,
                content: lines.join('')
            })
            tools.exit.success('Gist updated!')
        } catch (err) {
            tools.log.debug('Error getting or update the Gist:')
            return tools.exit.failure(err)
        }
    },
    {
      event: 'schedule',
      secrets: ['GIST_ID', 'OSU_USERNAME', 'OSU_MODE', 'GH_TOKEN', 'CLIENT_ID', 'CLIENT_SECRET']
    }
)

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
