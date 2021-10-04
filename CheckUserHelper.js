// Author: [[User:Ladsgroup]]
// License: GPLv3
// Source: https://github.com/Ladsgroup/CheckUserHelper

/*jshint esversion: 6 */
/* global mw, jQuery */

(function ($) {
  function createTable(data) {
    let tbl = document.createElement("table");
    tbl.className = "wikitable";
    tbl.id = "SummaryTable";
    let tr = tbl.insertRow();
    mw.loader.using("jquery.makeCollapsible").then(function () {
      $("#SummaryTable").makeCollapsible();
    });
    tr.appendChild($("<th>").text("User")[0]);
    tr.appendChild($("<th>").text("IP(s)")[0]);
    tr.appendChild($("<th>").text("User Agent(s)")[0]);

    for (let user in data) {
      let tr = tbl.insertRow();
      let td = tr.insertCell();
      let userContribs = document.createElement("a");
      userContribs.setAttribute("target", "_blank");
      userContribs.setAttribute("title", user);
      userContribs.setAttribute("class", "mw-userlink userlink");
      userContribs.setAttribute("href", "/wiki/Special:Contributions/" + user);
      userContribs.appendChild(document.createTextNode(user));
      td.appendChild(userContribs);
      if (data[user].ip.length > 1) {
        let ips = document.createElement("ul");
        for (let i = 0, len = data[user].ip.length; i < len; i++) {
          let ip = document.createElement("li");
          let linkText =
            "<a title='" +
            data[user].ip[i] +
            "' target='_blank' class='userlink'" +
            "href='/wiki/Special:Contributions/" +
            data[user].ip[i] +
            "'>" +
            data[user].ip[i] +
            "</a>";
          ip.innerHTML = linkText;
          ips.appendChild(ip);
        }
        let td = tr.insertCell();
        td.appendChild(ips);
      } else {
        let td = tr.insertCell();
        let ipContribs = document.createElement("a");
        ipContribs.setAttribute("target", "_blank");
        ipContribs.setAttribute("title", data[user].ip[0]);
        ipContribs.setAttribute("class", "userlink");
        ipContribs.setAttribute(
          "href",
          "/wiki/Special:Contributions/" + data[user].ip[0]
        );
        ipContribs.appendChild(document.createTextNode(data[user].ip[0]));
        td.appendChild(ipContribs);
      }

      if (data[user].ua.length > 1) {
        let uas = document.createElement("ul");
        for (let i = 0, len = data[user].ua.length; i < len; i++) {
          let ua = document.createElement("li");
          ua.innerHTML = "<code>" + data[user].ua[i] + "</code>";
          uas.appendChild(ua);
        }
        let td = tr.insertCell();
        td.appendChild(uas);
      } else {
        let td = tr.insertCell();
        let ua = document.createElement("code");
        ua.innerText = data[user].ua[0];
        td.appendChild(ua);
      }
    }
    $("#checkuserform").after(tbl);
  }

  function createTableText(data) {
    let text = "{| class=wikitable\n! User!! IP(s)!! UA(s)\n|-\n";

    for (let user in data) {
      text += "| [[User:" + user + "|" + user + "]]||";
      if (data[user].ip.length > 1) {
        for (let i = 0, len = data[user].ip.length; i < len; i++) {
          text +=
            "\n* [[Special:Contributions/" +
            data[user].ip[i] +
            "|" +
            data[user].ip[i] +
            "]]";
        }
      } else {
        text +=
          "[[Special:Contributions/" +
          data[user].ip +
          "|" +
          data[user].ip +
          "]]";
      }
      text += "\n|";

      if (data[user].ua.length > 1) {
        for (let i = 0, len = data[user].ua.length; i < len; i++) {
          text += "\n* <code>" + data[user].ua[i] + "</code>";
        }
      } else {
        text += "\n* <code>" + data[user].ua[0] + "</code>";
      }

      text += "\n|-\n";
    }
    text += "|}";
    return text;
  }

  function compareIPs(a, b) {
    const num1 =
      a.indexOf(".") > -1
        ? Number(
            a
              .split(".")
              .map((num) => `000${num}`.slice(-3))
              .join("")
          )
        : Number(
            "0x" +
              a
                .split(":")
                .map((num) => `0000${num}`.slice(-4))
                .join("")
          );
    const num2 =
      b.indexOf(".") > -1
        ? Number(
            b
              .split(".")
              .map((num) => `000${num}`.slice(-3))
              .join("")
          )
        : Number(
            "0x" +
              b
                .split(":")
                .map((num) => `0000${num}`.slice(-4))
                .join("")
          );
    return num1 - num2;
  }

  function theGadget() {
    let data = {},
      hasData = false;
    $("#checkuserresults li").each(function () {
      let user = $(this)
        .children("span")
        .children(".mw-userlink")
        .first()
        .text();
      if (!user) {
        return;
      }
      let ua = $(this).children("small").children(".mw-checkuser-agent").text();
      let uas = [];
      if (!ua) {
        $(this)
          .children("ol")
          .last()
          .children("li")
          .children("i")
          .each(function () {
            uas.push($(this).text());
          });
      } else {
        uas = [ua];
      }
      let ip = $(this).children("small").children("a").children("bdi").text();
      let ips = [];
      if (!ip) {
        $(this)
          .children("ol")
          .first()
          .children("li")
          .children("a")
          .each(function () {
            ips.push($(this).children("bdi").text());
          });
      } else {
        ips = [ip];
      }
      hasData = true;
      if (data[user]) {
        for (let i in ips) {
          ip = ips[i];
          if (data[user].ip.indexOf(ip) === -1) {
            data[user].ip.push(ip);
          }
        }

        for (let i in uas) {
          ua = uas[i];
          if (data[user].ua.indexOf(ua) === -1) {
            data[user].ua.push(ua);
          }
        }
      } else {
        data[user] = { ip: ips, ua: uas };
      }
    });
    if (!hasData) {
      return;
    }
    // sort IPs and UAs
    $.each(data, function (idx) {
      let ip = data[idx].ip;
      ip.sort(compareIPs);
      data[idx].ip = ip;
      data[idx].ua.sort();
    });
    createTable(data);
    let copyText = createTableText(data);
    mw.loader.using("mediawiki.widgets", function () {
      let dir =
        document.getElementsByTagName("html")[0].dir == "ltr"
          ? "left"
          : "right";
      let shortened = new mw.widgets.CopyTextLayout({
        align: "top",
        copyText: copyText,
        successMessage: "Copied",
        multiline: true,
        failMessage: "Could not copy",
      });
      shortened.textInput.$element.css(dir, "-9999px");
      shortened.textInput.$element.css("position", "absolute");
      shortened.buttonWidget.$element.css("position", "absolute");
      shortened.buttonWidget.$element.css(dir, "0px");
      shortened.buttonWidget.$element.after("<br>");
      $("#SummaryTable").after(shortened.$element);
    });
  }

  if (mw.config.get("wgCanonicalSpecialPageName") == "CheckUser") {
    theGadget();
  }
})(jQuery);
