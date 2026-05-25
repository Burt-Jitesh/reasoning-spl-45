# Extract all hyperlinks and their relationship IDs
[xml]$rels = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\docx_temp\word\_rels\document.xml.rels'

$hyperlinks = $rels.Relationships.Relationship | Where-Object { $_.Type -like '*hyperlink*' }

Write-Output "=== TOTAL HYPERLINKS: $($hyperlinks.Count) ==="

# Categorize links
$videoLinks = @()
$pdfLinks = @()
$youtubeLinks = @()
$otherLinks = @()

foreach ($link in $hyperlinks) {
    $url = $link.Target
    $id = $link.Id
    
    if ($url -like '*brightcove*' -or $url -like '*m3u8*') {
        $videoLinks += [PSCustomObject]@{Id=$id; Url=$url}
    }
    elseif ($url -like '*youtube*') {
        $youtubeLinks += [PSCustomObject]@{Id=$id; Url=$url}
    }
    elseif ($url -like '*.pdf*') {
        $pdfLinks += [PSCustomObject]@{Id=$id; Url=$url}
    }
    else {
        $otherLinks += [PSCustomObject]@{Id=$id; Url=$url}
    }
}

Write-Output "Brightcove Videos: $($videoLinks.Count)"
Write-Output "YouTube Videos: $($youtubeLinks.Count)"
Write-Output "PDF Links: $($pdfLinks.Count)"
Write-Output "Other Links: $($otherLinks.Count)"

Write-Output ""
Write-Output "=== YOUTUBE LINKS ==="
foreach ($yt in $youtubeLinks) {
    Write-Output "$($yt.Id) => $($yt.Url)"
}

Write-Output ""
Write-Output "=== PDF LINKS (first 20) ==="
foreach ($pdf in ($pdfLinks | Select-Object -First 20)) {
    Write-Output "$($pdf.Id) => $($pdf.Url)"
}

Write-Output ""
Write-Output "=== SAMPLE BRIGHTCOVE LINKS (first 5 - showing video IDs only) ==="
foreach ($vid in ($videoLinks | Select-Object -First 5)) {
    # Extract video ID from brightcove URL
    if ($vid.Url -match 'videos/(\d+)/') {
        Write-Output "$($vid.Id) => VideoID: $($Matches[1])"
    }
}
