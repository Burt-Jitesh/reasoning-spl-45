$json = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\course_data.json' -Raw | ConvertFrom-Json
Write-Output "Videos count: $($json.videos.Count)"
Write-Output "PDFs count: $($json.pdfs.Count)"
Write-Output ""
Write-Output "=== ALL VIDEO TITLES ==="
$i = 1
foreach ($v in $json.videos) {
    Write-Output "$i. $($v.title)"
    $i++
}
Write-Output ""
Write-Output "=== ALL PDF TITLES ==="
$i = 1
foreach ($p in $json.pdfs) {
    Write-Output "$i. $($p.title)"
    $i++
}
