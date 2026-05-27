$r = Get-Content 'course_data_clean.json' -Raw | ConvertFrom-Json
$e = Get-Content 'english_data.json' -Raw | ConvertFrom-Json
$m = Get-Content 'maths_data.json' -Raw | ConvertFrom-Json

$global = @{
    reasoning = @{
        id = 'reasoning'
        title = 'Reasoning SPL-45'
        teacher = 'Piyush Sir'
        color = '#3b82f6'
        icon = 'ri-brain-line'
        videos = $r.videos
        pdfs = $r.pdfs
    }
    english = @{
        id = 'english'
        title = 'English Spl-27 (Live + VOD)'
        teacher = 'Jaideep Sir'
        color = '#8b5cf6'
        icon = 'ri-translate-2'
        videos = $e.videos
        pdfs = $e.pdfs
    }
    maths = @{
        id = 'maths'
        title = 'Maths VOD (Arith+Adv) B-12'
        teacher = 'Gagan Pratap Sir'
        color = '#ec4899'
        icon = 'ri-functions'
        videos = $m.videos
        pdfs = $m.pdfs
    }
}

$json = $global | ConvertTo-Json -Depth 6
Set-Content 'data.js' ('const globalPlatformData = ' + $json + ';')
Write-Output "Successfully built data.js"
